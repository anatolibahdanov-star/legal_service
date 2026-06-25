# 25.06.2026

CREATE TABLE IF NOT EXISTS setting(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(16) NOT NULL DEFAULT 'int',
    grp VARCHAR(64) NOT NULL DEFAULT 'general',
    weight INT NOT NULL DEFAULT 0,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS setting_audit(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    setting_code VARCHAR(64) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    admin_id INT UNSIGNED NULL,
    created_at DATETIME DEFAULT NOW(),
    KEY idx_setting_audit_code (setting_code),
    KEY idx_setting_audit_admin_id (admin_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prompt_version(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    body MEDIUMTEXT NOT NULL,
    is_active TINYINT NOT NULL DEFAULT 0,
    admin_id INT UNSIGNED NULL,
    created_at DATETIME DEFAULT NOW(),
    KEY idx_prompt_version_code (code),
    KEY idx_prompt_version_active (code, is_active),
    KEY idx_prompt_version_admin_id (admin_id)
) ENGINE=InnoDB;

INSERT INTO setting (code, name, description, value, value_type, grp, weight) VALUES
('question_price_main',     'Цена вопроса (сайт), ₽',          'Стоимость одного вопроса для пользователей с публичного сайта (в рублях, можно дробное).',         '4.5',   'decimal', 'pricing', 10),
('question_price_lk',       'Цена вопроса (личный кабинет), ₽', 'Стоимость одного вопроса для пользователей из личного кабинета (в рублях, можно дробное).',        '3',     'decimal', 'pricing', 20),
('fixed_fee_rub',           'Фиксированная плата за услуги, ₽', 'Надбавка к цене вопроса. Прибавляется к стоимости вопроса в обоих сценариях оплаты. 0 — отключено.', '0',     'decimal', 'pricing', 30),
('min_topup_rub',           'Мин. сумма пополнения баланса, ₽', 'Минимальная сумма пополнения баланса (в рублях). Проверяется на сервере при создании платежа.',    '100',   'decimal', 'finance', 40),
('otp_ttl_minutes',         'Время жизни OTP-кода, мин.',       'Сколько минут действителен SMS-код подтверждения после отправки.',                                  '1440',  'int',     'security', 50),
('otp_max_attempts',        'Попыток ввода OTP до блокировки',  'Сколько неверных вводов кода допускается до блокировки номера.',                                    '5',     'int',     'security', 60),
('otp_lock_minutes',        'Блокировка после неверного OTP, мин.', 'На сколько минут блокируется номер после исчерпания попыток ввода OTP.',                         '1440',  'int',     'security', 70),
('otp_cooldown_attempts',   'Попыток OTP до паузы',             'После скольких неверных вводов включается короткая пауза (cooldown).',                              '3',     'int',     'security', 80),
('otp_cooldown_minutes',    'Длительность паузы OTP, мин.',     'Длительность короткой паузы (cooldown) между сериями неверных вводов OTP.',                          '5',     'int',     'security', 90),
('login_max_attempts',      'Попыток входа (email) до блокировки', 'Сколько неверных попыток входа по email допускается до блокировки.',                             '5',     'int',     'security', 100),
('login_lock_minutes',      'Блокировка входа (email), мин.',   'На сколько минут блокируется вход по email после исчерпания попыток.',                              '15',    'int',     'security', 110),
('unpaid_reminder_enabled', 'Включить напоминания об оплате',   'Включает рассылку напоминаний о неоплаченных вопросах.',                                            '0',     'bool',    'notifications', 120),
('unpaid_reminder_days',    'Интервал напоминаний об оплате, дн.', 'Минимальный возраст неоплаченного вопроса (в днях), после которого отправляется напоминание.',    '3',     'int',     'notifications', 130),
('ai_model',                'Модель ИИ для ответов',            'Идентификатор модели Grok, используемой для генерации ответов (например, grok-4).',                 'grok-4', 'string', 'ai', 140)
ON DUPLICATE KEY UPDATE code = code;
