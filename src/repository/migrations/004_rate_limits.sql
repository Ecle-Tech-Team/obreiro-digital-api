CREATE TABLE IF NOT EXISTS rate_limits (
  key_hash CHAR(64) PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  INDEX idx_rate_limits_expires (expires_at)
);
