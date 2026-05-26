# 23.05.2026

CREATE TABLE IF NOT EXISTS question_pdf(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    content_hash VARCHAR(64) NOT NULL DEFAULT '',
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_question_pdf_question_id (question_id),
    KEY idx_question_pdf_user_id (user_id),
    CONSTRAINT fk_question_pdf_question_id
        FOREIGN KEY (question_id)
        REFERENCES question (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_question_pdf_user_id
        FOREIGN KEY (user_id)
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pdf_share_link(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    token CHAR(64) NOT NULL,
    revoked TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_pdf_share_link_question_id (question_id),
    UNIQUE KEY uniq_pdf_share_link_token (token),
    KEY idx_pdf_share_link_user_id (user_id),
    CONSTRAINT fk_pdf_share_link_question_id
        FOREIGN KEY (question_id)
        REFERENCES question (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pdf_share_link_user_id
        FOREIGN KEY (user_id)
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
