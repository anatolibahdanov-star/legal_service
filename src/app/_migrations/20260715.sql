-- Аватары пользователей и сотрудников хранятся в БД.
CREATE TABLE IF NOT EXISTS profile_avatar (
    owner_type ENUM('user', 'administrator') NOT NULL,
    owner_id INT UNSIGNED NOT NULL,
    content_type VARCHAR(64) NOT NULL,
    image_data MEDIUMBLOB NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (owner_type, owner_id)
) ENGINE=InnoDB;
