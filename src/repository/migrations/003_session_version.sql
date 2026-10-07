-- Run after backup. Incrementing this value revokes all outstanding sessions for a user.
ALTER TABLE user ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0;
