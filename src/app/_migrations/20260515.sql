# 15.05.2026

INSERT INTO reply(question_id, reply, status)
SELECT q.id, '', 0
FROM question q
LEFT JOIN reply r ON r.question_id = q.id
WHERE r.id IS NULL;


INSERT INTO final_reply(reply_id, final_reply, status)
SELECT r.id, '', 0
FROM reply r
LEFT JOIN final_reply fr ON fr.reply_id = r.id
WHERE fr.id IS NULL;
