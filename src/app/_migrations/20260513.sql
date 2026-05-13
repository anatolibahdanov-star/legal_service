# 13.05.2026

ALTER TABLE user
  ADD COLUMN is_first_question_free TINYINT NOT NULL DEFAULT 1
  AFTER is_register;

# Backfill: users who already have a root question are NOT entitled.
UPDATE user u
  SET u.is_first_question_free = 0
  WHERE EXISTS (
    SELECT 1 FROM question q
    WHERE q.user_id = u.id AND q.parent_id IS NULL
  );

ALTER TABLE porder
  ADD COLUMN question_id INT UNSIGNED NULL AFTER order_type,
  ADD CONSTRAINT fk_porder_question_id
    FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE SET NULL;
