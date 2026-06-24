# 24.06.2026 — automatic retry of failed/stuck payments (cron)

ALTER TABLE porder
  ADD COLUMN retry_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER reason,
  ADD COLUMN next_retry_at DATETIME NULL AFTER retry_count,
  ADD COLUMN last_retry_at DATETIME NULL AFTER next_retry_at,
  ADD COLUMN retry_locked_at DATETIME NULL AFTER last_retry_at,
  ADD COLUMN retry_lock_token VARCHAR(64) NULL AFTER retry_locked_at;

ALTER TABLE porder ADD INDEX idx_porder_retry (status, next_retry_at);

CREATE TABLE IF NOT EXISTS payment_retry_log(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    attempt TINYINT UNSIGNED NOT NULL,
    method VARCHAR(20) NOT NULL,
    success TINYINT NOT NULL DEFAULT 0,
    status_before TINYINT NOT NULL,
    status_after TINYINT NOT NULL,
    alpha_status TINYINT NULL,
    message VARCHAR(500) NULL,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_retry_log_order_id
        FOREIGN KEY (order_id)
        REFERENCES porder (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
