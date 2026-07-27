# 24.07.2026

-- Система подписок: каталог тарифов, подписки пользователей, история операций
-- с подписками и лотовая модель бесплатных вопросов (источник + приоритет + срок).

-- Каталог тарифов (админ-редактируемый ресурс «Подписки»).
-- Цена хранится в целых рублях (валидация: > 0, целое). bv_amount — месячный лимит БВ.
CREATE TABLE IF NOT EXISTS subscription_plan(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    price_rub INT UNSIGNED NOT NULL,
    bv_amount INT UNSIGNED NOT NULL,
    period TINYINT NOT NULL DEFAULT 1,
    tone VARCHAR(16) NULL DEFAULT NULL,
    badge VARCHAR(200) NULL DEFAULT NULL,
    featured TINYINT NOT NULL DEFAULT 0,
    weight INT NOT NULL DEFAULT 0,
    is_active TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

-- Подписка пользователя. Одна активная на пользователя (гарантируется в сервисе).
-- Строка живёт весь жизненный цикл: продлевается/меняет тариф, по окончании
-- переходит в Expired/Cancelled и остаётся историческим фактом.
CREATE TABLE IF NOT EXISTS subscription(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    plan_id INT UNSIGNED NULL DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    price_rub INT UNSIGNED NOT NULL,
    bv_amount INT UNSIGNED NOT NULL,
    period_start DATETIME NULL DEFAULT NULL,
    period_end DATETIME NULL DEFAULT NULL,
    binding_id VARCHAR(255) NULL DEFAULT NULL,
    next_charge_at DATETIME NULL DEFAULT NULL,
    order_id INT UNSIGNED NULL DEFAULT NULL,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    KEY idx_subscription_user_id (user_id),
    KEY idx_subscription_user_status (user_id, status),
    KEY idx_subscription_status_period (status, period_end),
    CONSTRAINT fk_subscription_user_id
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_plan_id
        FOREIGN KEY (plan_id) REFERENCES subscription_plan (id) ON DELETE SET NULL,
    CONSTRAINT fk_subscription_order_id
        FOREIGN KEY (order_id) REFERENCES porder (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- История операций с подпиской (покупка/продление/апгрейд/даунгрейд/сгорание/отмена).
-- Каждая строка снапшотит тариф, цену, период, начисленный лимит и статус после операции.
CREATE TABLE IF NOT EXISTS subscription_history(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT UNSIGNED NULL DEFAULT NULL,
    user_id INT UNSIGNED NOT NULL,
    event_type TINYINT NOT NULL,
    plan_id INT UNSIGNED NULL DEFAULT NULL,
    plan_name VARCHAR(200) NULL DEFAULT NULL,
    price_rub INT NULL DEFAULT NULL,
    bv_amount INT NULL DEFAULT NULL,
    bv_delta INT NULL DEFAULT NULL,
    period_start DATETIME NULL DEFAULT NULL,
    period_end DATETIME NULL DEFAULT NULL,
    status_after TINYINT NULL DEFAULT NULL,
    order_id INT UNSIGNED NULL DEFAULT NULL,
    admin_id INT UNSIGNED NULL DEFAULT NULL,
    comment VARCHAR(500) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_subscription_history_user_id (user_id),
    KEY idx_subscription_history_subscription (subscription_id, event_type),
    CONSTRAINT fk_subscription_history_user_id
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_history_subscription_id
        FOREIGN KEY (subscription_id) REFERENCES subscription (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_history_plan_id
        FOREIGN KEY (plan_id) REFERENCES subscription_plan (id) ON DELETE SET NULL,
    CONSTRAINT fk_subscription_history_order_id
        FOREIGN KEY (order_id) REFERENCES porder (id) ON DELETE SET NULL,
    CONSTRAINT fk_subscription_history_admin_id
        FOREIGN KEY (admin_id) REFERENCES administrator (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Лоты бесплатных вопросов. Разделяют БВ по источнику (админ / подписка),
-- приоритету списания и сроку годности. Админские лоты: expires_at=NULL
-- (бессрочные, неприкосновенны операциями с подписками). Подписочные лоты:
-- expires_at = period_end подписки; при списании имеют приоритет над админскими.
CREATE TABLE IF NOT EXISTS free_question_grant(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    source TINYINT NOT NULL,
    remaining INT NOT NULL,
    initial INT NOT NULL,
    expires_at DATETIME NULL DEFAULT NULL,
    subscription_id INT UNSIGNED NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_free_question_grant_user_id (user_id),
    KEY idx_free_question_grant_user_source (user_id, source),
    KEY idx_free_question_grant_expires (expires_at),
    KEY idx_free_question_grant_subscription (subscription_id),
    CONSTRAINT fk_free_question_grant_user_id
        FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
    CONSTRAINT fk_free_question_grant_subscription_id
        FOREIGN KEY (subscription_id) REFERENCES subscription (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Привязка каждой операции в леджере БВ к конкретному лоту и источнику,
-- чтобы история корректно различала админские и подписочные движения.
ALTER TABLE free_question_operation
    ADD COLUMN source TINYINT NULL DEFAULT NULL AFTER op_type,
    ADD COLUMN grant_id INT UNSIGNED NULL DEFAULT NULL AFTER source,
    ADD CONSTRAINT fk_free_question_operation_grant_id
        FOREIGN KEY (grant_id) REFERENCES free_question_grant (id) ON DELETE SET NULL;

-- Бэкфилл: превращаем текущий счётчик free_questions каждого пользователя в один
-- бессрочный админский лот, чтобы ничего не потерять при переходе на лотовую модель.
INSERT INTO free_question_grant (user_id, source, remaining, initial, expires_at, created_at)
SELECT id, 1, free_questions, free_questions, NULL, NOW()
FROM user
WHERE free_questions > 0;

-- Три активных тарифа для лендинга (соответствуют текущему хардкоду).
INSERT INTO subscription_plan (code, name, description, price_rub, bv_amount, tone, badge, featured, weight, is_active) VALUES
('start',    'Старт',    'Ежемесячная подписка: 5 вопросов',  7000,  5,  'yellow', '5 запросов в месяц для базовых задач',          0, 20, 1),
('standard', 'Стандарт', 'Ежемесячная подписка: 10 вопросов', 15000, 10, 'purple', '10 вопросов в месяц – оптимальный баланс',      1, 30, 1),
('max',      'Максимум', 'Ежемесячная подписка: 30 вопросов', 35000, 30, 'green',  '30 вопросов в месяц для максимальной поддержки', 0, 40, 1)
ON DUPLICATE KEY UPDATE code = code;
