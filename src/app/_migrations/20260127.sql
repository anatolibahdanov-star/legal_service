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
    reply VARCHAR(2000) NOT NULL,
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
    final_reply VARCHAR(3000) NOT NULL,
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

INSERT INTO question(question, user_id) 
VALUES("Vasia Pupkin question 1", 1),
("Vasia Pupkin question 2", 1),
("Liza Kuku question 1", 4);

INSERT INTO reply(reply, question_id) 
VALUES("Vasia Pupkin response 1", 1),
("Vasia Pupkin response 2", 2),
("Liza Kuku response 1", 3);

INSERT INTO final_reply(final_reply, reply_id, admin_id) 
VALUES("Vasia Pupkin final response 1", 1, 1),
("Vasia Pupkin final response 2", 2, 2),
("Liza Kuku final response 1", 3, 2);

INSERT INTO statistic(st_date, avg_llm_time, avg_manager_time, avg_request_time) 
VALUES("2026-01-20", 10.5, 255.9, 1000.1),
("2026-01-21", 11.5, 275.9, 1010.1),
("2026-01-22", 12.5, 285.9, 1020.1),
("2026-01-24", 13.5, 295.9, 1030.1),
("2026-01-25", 17.5, 215.9, 1005.1),
("2026-01-26", 9.5, 205.9, 1001.1);