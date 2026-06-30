# 29.06.2026

-- Бесплатные вопросы: счётчик на пользователе + леджер операций (начисление/списание).
ALTER TABLE user
  ADD COLUMN free_questions INT NOT NULL DEFAULT 0 AFTER balance;

CREATE TABLE IF NOT EXISTS free_question_operation(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NULL DEFAULT NULL,
    question_id INT UNSIGNED NULL DEFAULT NULL,
    op_type TINYINT NOT NULL,
    amount INT NOT NULL,
    comment VARCHAR(500) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_free_question_operation_user_id (user_id),
    KEY idx_free_question_operation_user_type (user_id, op_type),
    CONSTRAINT fk_free_question_operation_user_id
        FOREIGN KEY (user_id)
        REFERENCES user (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_free_question_operation_admin_id
        FOREIGN KEY (admin_id)
        REFERENCES administrator (id)
        ON DELETE SET NULL,
    CONSTRAINT fk_free_question_operation_question_id
        FOREIGN KEY (question_id)
        REFERENCES question (id)
        ON DELETE SET NULL
) ENGINE=InnoDB;
