ALTER TABLE question ADD COLUMN parent_id INT UNSIGNED AFTER category_id, ADD CONSTRAINT fk_question_parent_id
        FOREIGN KEY (parent_id) 
        REFERENCES question (id)
        ON DELETE SET NULL;
ALTER TABLE question ADD COLUMN updated_at DATETIME DEFAULT NOW() AFTER email_status;

ALTER TABLE question ADD COLUMN rating TINYINT AFTER email_status, ADD COLUMN comment VARCHAR(255) AFTER rating;
ALTER TABLE question ADD COLUMN rating_date DATETIME AFTER comment;

ALTER TABLE question ADD COLUMN admin_id INT UNSIGNED AFTER id, ADD CONSTRAINT fk_question_admin_id
        FOREIGN KEY (admin_id) 
        REFERENCES administrator (id)
        ON DELETE SET NULL;
ALTER TABLE final_reply ADD COLUMN updated_at DATETIME DEFAULT NOW() AFTER created_at;
ALTER TABLE reply ADD COLUMN updated_at DATETIME DEFAULT NOW() AFTER created_at;

ALTER TABLE final_reply MODIFY COLUMN admin_id INT UNSIGNED;
ALTER TABLE question ADD COLUMN job_status TINYINT NOT NULL DEFAULT 1 AFTER uuid;
ALTER TABLE question ADD COLUMN info_status TINYINT NOT NULL DEFAULT 0 AFTER comment;
ALTER TABLE administrator ADD COLUMN rating TINYINT DEFAULT 0 AFTER created_admin_id;
ALTER TABLE administrator MODIFY COLUMN rating FLOAT DEFAULT 0;


ALTER TABLE user ADD COLUMN balance FLOAT NOT NULL DEFAULT 0 AFTER password;

CREATE TABLE IF NOT EXISTS porder(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_type TINYINT NOT NULL DEFAULT 1,
    alpha_id VARCHAR(300) NOT NULL,
    alpha_status VARCHAR(300) NOT NULL,
    alpha_qr_url VARCHAR(300) NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_order_user_id
        FOREIGN KEY (user_id) 
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS balance(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED,
    balance_type TINYINT NOT NULL DEFAULT 1,
    amount FLOAT NOT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    data VARCHAR(300),
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_balance_user_id
        FOREIGN KEY (user_id) 
        REFERENCES user (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_balance_order_id
        FOREIGN KEY (order_id) 
        REFERENCES porder (id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ptransaction(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    trans_type TINYINT NOT NULL DEFAULT 1,
    status TINYINT NOT NULL DEFAULT 1,
    data VARCHAR(300),
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_transaction_order_id
        FOREIGN KEY (order_id) 
        REFERENCES porder (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE porder ADD COLUMN amount FLOAT NOT NULL AFTER order_type;
ALTER TABLE porder ADD COLUMN alpha_form_url VARCHAR(300) NOT NULL AFTER alpha_status;

ALTER TABLE question MODIFY COLUMN question VARCHAR(5000) NOT NULL;
ALTER TABLE reply MODIFY COLUMN reply TEXT NOT NULL;
ALTER TABLE final_reply MODIFY COLUMN final_reply TEXT NOT NULL;

CREATE TABLE IF NOT EXISTS contact(
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    email VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    email_status TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_contact_user_id
        FOREIGN KEY (user_id) 
        REFERENCES user (id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
ALTER TABLE contact ADD COLUMN phone VARCHAR(20) NOT NULL AFTER email;
ALTER TABLE porder DROP COLUMN alpha_status, ADD COLUMN alpha_status TINYINT NOT NULL DEFAULT 0 after alpha_id;
ALTER TABLE porder ADD COLUMN reason VARCHAR(500) after status;
ALTER TABLE porder ADD COLUMN data TEXT after alpha_qr_url;
ALTER TABLE ptransaction MODIFY COLUMN `data` TEXT;