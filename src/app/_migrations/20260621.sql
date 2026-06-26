# 21.06.2026

ALTER TABLE user
  ADD COLUMN email_verified TINYINT NOT NULL DEFAULT 1 AFTER email,
  ADD COLUMN email_verify_token VARCHAR(64) NULL AFTER email_verified;

ALTER TABLE user
  ADD UNIQUE KEY uniq_user_email_verify_token (email_verify_token);
