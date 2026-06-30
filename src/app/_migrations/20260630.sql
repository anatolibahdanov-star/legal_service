# 30.06.2026

CREATE TABLE IF NOT EXISTS question_attachment(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    source ENUM('user','lawyer') NOT NULL DEFAULT 'user',
    uploaded_by_admin_id INT UNSIGNED NULL DEFAULT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    extension VARCHAR(16) NOT NULL DEFAULT '',
    mime VARCHAR(127) NULL DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_question_attachment_question_id (question_id),
    KEY idx_question_attachment_question_source (question_id, source),
    KEY idx_question_attachment_user_id (user_id),
    CONSTRAINT fk_question_attachment_question_id
        FOREIGN KEY (question_id)
        REFERENCES question (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_question_attachment_user_id
        FOREIGN KEY (user_id)
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
