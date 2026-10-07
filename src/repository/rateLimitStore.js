import { createHash } from 'node:crypto';
import database from './connection.js';

export async function incrementRateLimit(key, now, windowMs) {
  const keyHash = createHash('sha256').update(key).digest('hex');
  const expiresAt = now + windowMs;
  const conn = await database.connect();
  try {
    await conn.query(`INSERT INTO rate_limits (key_hash, attempts, expires_at) VALUES (?, 1, ?)
      ON DUPLICATE KEY UPDATE
        attempts = IF(expires_at <= ?, 1, attempts + 1),
        expires_at = IF(expires_at <= ?, VALUES(expires_at), expires_at)`,
      [keyHash, expiresAt, now, now]);
    const [[entry]] = await conn.query('SELECT attempts, expires_at FROM rate_limits WHERE key_hash = ?', [keyHash]);
    if (Math.random() < 0.01) await conn.query('DELETE FROM rate_limits WHERE expires_at < ? LIMIT 1000', [now]);
    return { count: entry.attempts, until: Number(entry.expires_at) };
  } finally { await conn.end(); }
}
