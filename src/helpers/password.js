import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password, { allowShort = false } = {}) {
  if (typeof password !== 'string' || password.length < (allowShort ? 1 : 10) || password.length > 1024) throw new Error('Senha inválida.');
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `$scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  if (!stored.startsWith('$scrypt$')) {
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const parts = stored.split('$');
  if (parts.length !== 4 || !/^[a-f0-9]{32}$/i.test(parts[2]) || !/^[a-f0-9]{128}$/i.test(parts[3])) return false;
  const derived = await scrypt(password, Buffer.from(parts[2], 'hex'), 64);
  return timingSafeEqual(derived, Buffer.from(parts[3], 'hex'));
}
