import { demo, requireUserId, printSub } from './_lib.mjs';

const userId = requireUserId('expire.mjs');
console.log('=== ДЕМО 2: удаление подписки по окончании срока ===');

const before = (await demo('status', userId)).subscription;
printSub('До', before);
if (!before) process.exit(1);

const tick = await demo('expire-tick');
console.log(`Цикл экспирации выполнен: закрыто подписок ${tick.expiredSubscriptions}.`);

const after = (await demo('status', userId)).subscription;
if (!after) {
  console.log('✓ Подписка удалена у пользователя (статус «Истекла»), неиспользованные подписочные вопросы сгорели, админские начисления не тронуты. Запись сохранена в истории — видна в личном кабинете и в админке.');
} else {
  printSub('После', after);
  console.log('✗ Подписка всё ещё активна — убедитесь, что перед этим выполнен set-period-now.mjs.');
  process.exit(1);
}
