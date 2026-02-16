# 27.01.2026

CREATE TABLE IF NOT EXISTS statistic(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    st_date DATE NOT NULL,
    avg_llm_time FLOAT NOT NULL,
    avg_manager_time FLOAT NOT NULL,
    avg_request_time FLOAT NOT NULL
) ENGINE=InnoDB;
CREATE INDEX st_date_idx ON statistic(st_date);

CREATE TABLE IF NOT EXISTS user(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT NOW()
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS question(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_question_user_id
        FOREIGN KEY (user_id) 
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reply(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reply VARCHAR(4000) NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_reply_question_id
        FOREIGN KEY (question_id) 
        REFERENCES question (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS administrator(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password CHAR(32) NOT NULL,
    created_admin_id INT UNSIGNED,
    user_id INT UNSIGNED NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    is_super BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_administrator_user_id
        FOREIGN KEY (user_id) 
        REFERENCES user (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_administrator_created_admin_id
        FOREIGN KEY (created_admin_id) 
        REFERENCES administrator (id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS final_reply(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    final_reply VARCHAR(5000) NOT NULL,
    reply_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_final_reply_reply_id
        FOREIGN KEY (reply_id) 
        REFERENCES reply (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_final_reply_admin_id
        FOREIGN KEY (admin_id) 
        REFERENCES administrator (id)
) ENGINE=InnoDB;


### DUMMY DATA
INSERT INTO user(name, email) 
VALUES("Vasia Pupkin", "vasia.pupkin@gmail.com"),
("Petya Admin", "petya.admin@gmail.com"),
("Anatoli Super Admin", "anatoli.super.admin@gmail.com"),
("Liza Kuku", "liza.kuku@gmail.com");

INSERT INTO administrator(username, password, created_admin_id, user_id, is_super) 
VALUES("petya", MD5("petya"), NULL, 2, FALSE),
("anatoli", MD5("anatoli"), NULL, 3, TRUE);

INSERT INTO question(question, user_id, uuid) 
VALUES("Vasia Pupkin question 1", 1, UUID_TO_BIN("941d9205-8226-4d96-be11-51250b3db6b1")),
("Vasia Pupkin question 2", 1, UUID_TO_BIN("11fb6f78-2090-4984-ad53-de825746f63f")),
("Liza Kuku question 1", 4, UUID_TO_BIN("5c7f5f5a-9b86-4715-9ca0-f1ccc40742b3"));

INSERT INTO reply(reply, question_id) 
VALUES("Vasia Pupkin response 1", 1),
("Vasia Pupkin response 2", 2),
("Liza Kuku response 1", 3);

INSERT INTO final_reply(final_reply, reply_id, admin_id) 
VALUES("Vasia Pupkin final response 1", 1, 1),
("Vasia Pupkin final response 2", 2, 2),
("Liza Kuku final response 1", 3, 2);

INSERT INTO statistic(st_date, avg_llm_time, avg_manager_time, avg_request_time) 
VALUES("2026-01-20", 40.5, 450.9, 800.1),
("2026-01-21", 11.5, 400.9, 910.1),
("2026-01-22", 100.5, 215.9, 1020.1),
("2026-01-24", 134.5, 255.9, 1730.1),
("2026-01-25", 21.5, 300.9, 505.1),
("2026-01-26", 2.5, 500.9, 701.1),
("2026-01-27", 12.5, 300.9, 1701.1),
("2026-01-28", 22.5, 400.9, 2701.1),
("2026-01-29", 32.5, 500.9, 1701.1),
("2026-01-30", 42.5, 210.9, 1201.1),
("2026-01-31", 52.5, 320.9, 301.1),
("2026-02-01", 62.5, 430.9, 1401.1),
("2026-02-02", 72.5, 540.9, 1601.1),
("2026-02-03", 82.5, 650.9, 1701.1),
("2026-02-04", 92.5, 760.9, 401.1),
("2026-02-05", 83.5, 340.9, 1501.1),
("2026-02-06", 61.5, 260.9, 901.1),
("2026-02-07", 112.5, 80.9, 1001.1);

ALTER TABLE question ADD COLUMN uuid BINARY(16) AFTER status;
CREATE INDEX uuid_question_idx ON question(uuid);

ALTER TABLE reply MODIFY reply VARCHAR(4000);
ALTER TABLE final_reply MODIFY final_reply VARCHAR(5000);

CREATE TABLE IF NOT EXISTS category(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    weight TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

ALTER TABLE question ADD COLUMN category_id INT UNSIGNED AFTER user_id, ADD CONSTRAINT fk_question_category_id
        FOREIGN KEY (category_id) 
        REFERENCES category (id)
        ON DELETE SET NULL;

INSERT INTO category(name, weight) 
VALUES("Объекты недвижимости", 1),
("Жилая недвижимость", 2),
("Коммерческая недвижимость", 3),
("Права на недвижимость", 4),
("Сделки с недвижимостью", 5),
("Ограничения и обременения", 6);

ALTER TABLE administrator ADD COLUMN name VARCHAR(300) NOT NULL AFTER id, ADD COLUMN email VARCHAR(255) NOT NULL AFTER name,
    DROP FOREIGN KEY fk_administrator_user_id, DROP COLUMN user_id;

ALTER TABLE reply ADD COLUMN duration BIGINT AFTER reply;

ALTER TABLE final_reply ADD COLUMN duration BIGINT AFTER final_reply, ADD COLUMN ready_at DATETIME;

CREATE INDEX category_name_idx ON category(name);

ALTER TABLE question ADD COLUMN email_status TINYINT NOT NULL DEFAULT 0 AFTER status;
