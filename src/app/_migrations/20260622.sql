# 22.06.2026

ALTER TABLE balance
  ADD COLUMN admin_id INT UNSIGNED NULL AFTER user_id,
  ADD COLUMN comment VARCHAR(500) NULL AFTER data,
  ADD CONSTRAINT fk_balance_admin_id
    FOREIGN KEY (admin_id) REFERENCES administrator(id) ON DELETE SET NULL;
