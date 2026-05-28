# 27.05.2026

ALTER TABLE question ADD COLUMN short_id CHAR(4) NULL AFTER uuid;
ALTER TABLE question ADD UNIQUE KEY uniq_question_short_id (short_id);
