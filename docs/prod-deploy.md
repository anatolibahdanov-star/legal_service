# Деплой на прод (89.108.110.219)

Проект живёт в `/var/www/lllms`, процесс pm2 называется `lllms-dev.ru`, приложение слушает порт 3002. Git на сервере не установлен — деплой выполняется копированием файлов, сборка на сервере.

## Порядок деплоя

1. Скопировать файлы проекта в `/var/www/lllms` (включая `ecosystem.config.js` и папку `certs/` — они обязаны остаться на сервере).
2. Собрать:

   ```bash
   cd /var/www/lllms && npm install && npm run build
   ```

3. Перезапустить **только так**:

   ```bash
   cd /var/www/lllms && pm2 startOrRestart ecosystem.config.js && pm2 save
   ```

## Чего делать нельзя

- **Нельзя** перезапускать через `pm2 restart lllms-dev.ru --update-env` или `pm2 delete` + `pm2 start npm -- start`: так процесс теряет переменную `NODE_EXTRA_CA_CERTS`, Node перестаёт доверять сертификату Минцифры на серверах Альфа-Банка, и все платежи/подписки падают с ошибкой `fetch failed` (инцидент 2026-08-09).
- **Нельзя** удалять с сервера папку `/var/www/lllms/certs/` и файл `/var/www/lllms/ecosystem.config.js`.

## Почему это важно

API Альфа-Банка (`alfa.rbsuat.com`, `pay.alfabank.ru`) использует TLS-сертификаты Минцифры, которых нет в стандартном наборе доверенных CA Node.js. Без доверия к ним все платежи падают с ошибкой `fetch failed`.

Основной механизм доверия теперь встроен в само приложение: `src/instrumentation.ts` при старте сервера читает `certs/russian_trusted_bundle.pem` и устанавливает глобальный undici-dispatcher с этим сертификатом поверх системных корневых. Это работает при любом способе запуска процесса и не зависит от переменных окружения. Единственное требование — `npm install` при деплое (нужен пакет `undici`) и наличие папки `certs/` рядом с приложением.

Страховочные слои на случай, если механизм в коде не сработает (файл сертификата удалён и т.п.): переменная `NODE_EXTRA_CA_CERTS=/var/www/lllms/certs/russian_trusted_bundle.pem` задана в `ecosystem.config.js`, в `/etc/environment` и в `/root/.bashrc` на сервере.

Путь к `npm` в `ecosystem.config.js` вычисляется автоматически от той версии Node, под которой запущен pm2 (`process.execPath`), — при обновлении Node через nvm править его не нужно.

## Быстрая проверка после деплоя

```bash
PID=$(pgrep -f "next-serve[r] [(]v" | head -1); tr "\0" "\n" < /proc/$PID/environ | grep NODE_EXTRA
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3002/
```

Первая команда должна вывести строку с `NODE_EXTRA_CA_CERTS`, вторая — `200`.
