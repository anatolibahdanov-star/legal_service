CREATE TABLE IF NOT EXISTS otp_attempts(
    phone VARCHAR(20) NOT NULL PRIMARY KEY,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    cooldown_until DATETIME NULL,
    last_attempt_at DATETIME NULL,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_attempts(
    email VARCHAR(255) NOT NULL PRIMARY KEY,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_attempt_at DATETIME NULL,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB;
