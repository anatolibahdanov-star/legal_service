# 24.06.2026

CREATE TABLE IF NOT EXISTS email_template(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(300) NOT NULL,
    body TEXT NOT NULL,
    button_label VARCHAR(120) NULL,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

INSERT INTO email_template (code, name, subject, body, button_label)
VALUES
('balance_topup_success', 'Успешное пополнение баланса', 'Баланс успешно пополнен',
'Уважаемый(ая) {name}!

Ваш баланс успешно пополнен на сумму {amount} ₽.

Детали операции:
• ID платежа: {payment_id}
• Дата и время: {datetime}
• Способ оплаты: {method}

Текущий баланс: {balance_questions} вопросов

Теперь вы можете использовать средства для оплаты услуг на платформе.',
'Перейти в историю платежей'),
('balance_topup_fail', 'Неуспешное пополнение баланса', 'Не удалось пополнить баланс',
'Уважаемый(ая) {name}!

К сожалению, не удалось пополнить баланс на сумму {amount} ₽.

Причина: {error}

Просим попробовать ещё раз или выбрать другой способ оплаты.',
'Пополнить баланс')
ON DUPLICATE KEY UPDATE code = code;


INSERT INTO email_template (code, name, subject, body, button_label)
VALUES
('question_answer_first', 'Ответ юриста — первый ответ', 'Юрист ответил на ваш вопрос №{question_id}',
'Уважаемый(ая) {user_name}!

Юрист опубликовал ответ на ваш вопрос №{question_id}.

В личном кабинете вы также можете задать дополнительные вопросы или оценить работу юриста.',
'Перейти к ответу'),
('question_answer_clarifying', 'Ответ юриста — уточняющие вопросы', 'Юрист ответил на уточняющие вопросы по делу №{question_id}',
'Уважаемый(ая) {user_name}!

Юрист ответил на все уточняющие вопросы по Вашему делу.

С полным текстом вопроса и всех ответов юриста вы можете ознакомиться по ссылке ниже.

В личном кабинете вы также можете задать дополнительные вопросы или оценить работу юриста.',
'Перейти к ответу')
ON DUPLICATE KEY UPDATE code = code;


INSERT INTO email_template (code, name, subject, body, button_label)
VALUES
('documents_ready', 'Документы по делу готовы', 'Документы по вашему запросу готовы — №{question_id}',
'Уважаемый(ая) {user_name}!

Юрист подготовил и опубликовал запрашиваемые документы по вашему делу.

✅ Готовые документы:
{documents}

С полным комплектом документов вы можете ознакомиться по ссылке ниже.

В личном кабинете вы также можете задать дополнительные вопросы юристу или оставить отзыв.',
'Скачать документы')
ON DUPLICATE KEY UPDATE code = code;


ALTER TABLE question ADD COLUMN reminder_sent TINYINT NOT NULL DEFAULT 0 AFTER email_status;

ALTER TABLE question ADD INDEX idx_question_reminder (status, reminder_sent, parent_id);

INSERT INTO email_template (code, name, subject, body, button_label)
VALUES
('unpaid_reminder', 'Напоминание об оплате вопроса', 'Ваш вопрос №{question_id} ожидает оплаты',
'Уважаемый(ая) {user_name}!

Мы заметили, что у вас есть вопрос №{question_id}, который ожидает оплаты.

Как только оплата будет произведена, наш юрист незамедлительно приступит к работе над ним.

Если вопрос всё ещё актуален, пополните, пожалуйста, баланс по кнопке ниже.

Спасибо, что доверяете нам!',
'Пополнить баланс')
ON DUPLICATE KEY UPDATE code = code;
