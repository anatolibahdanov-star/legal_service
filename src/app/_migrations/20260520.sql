# 20.05.2026

ALTER TABLE user
  ADD COLUMN temp_password CHAR(32) NULL AFTER password;
