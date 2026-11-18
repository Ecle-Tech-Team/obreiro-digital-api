import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { tokenSecret } from './tokenSecret.js';

export const RESET_CODE_TTL_MINUTES = 15;
export const RESET_MAX_ATTEMPTS = 5;

export const isResetCode = code => typeof code === 'string' && /^\d{6}$/.test(code);

export function generateResetCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

// HMAC com o segredo do servidor: um vazamento da tabela não revela os códigos.
export function hashResetCode(id_user, code) {
  return createHmac('sha256', tokenSecret()).update(`password-reset:${id_user}:${code}`).digest('hex');
}

export function resetCodeMatches(storedHash, id_user, code) {
  if (!isResetCode(code) || typeof storedHash !== 'string' || storedHash.length !== 64) return false;
  return timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hashResetCode(id_user, code), 'hex'));
}
