# 11.08.2026

INSERT INTO setting (code, name, description, value, value_type, grp, weight) VALUES
('one_time_question_price_rub', 'Цена разового вопроса, ₽', 'Стоимость карточки «Разовый запрос» на лендинге. Оплата картой, пользователю начисляется 1 бесплатный вопрос (деньги на баланс не зачисляются).', '2000', 'decimal', 'pricing', 15)
ON DUPLICATE KEY UPDATE code = code;

ALTER TABLE free_question_grant
    ADD COLUMN order_id INT UNSIGNED NULL DEFAULT NULL AFTER subscription_id,
    ADD UNIQUE KEY uk_free_question_grant_order (order_id),
    ADD CONSTRAINT fk_free_question_grant_order_id
        FOREIGN KEY (order_id) REFERENCES porder (id) ON DELETE SET NULL;
