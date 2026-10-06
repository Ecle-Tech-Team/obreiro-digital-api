import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import { tokenSecret } from './tokenSecret.js';

const tag = passwordHash => createHash('sha256').update(passwordHash).digest('hex');

export function issueResetToken(id_user, passwordHash) {
  return jwt.sign({ purpose: 'password-reset', id_user, password_tag: tag(passwordHash) }, tokenSecret(), { algorithm: 'HS256', expiresIn: '15m' });
}

export function resetIdentity(token) {
  const claims = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] });
  if (claims.purpose !== 'password-reset' || !Number.isSafeInteger(Number(claims.id_user))) throw new Error('Token inválido.');
  return Number(claims.id_user);
}

export function verifyResetToken(token, id_user, passwordHash) {
  try {
    const claims = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] });
    return claims.purpose === 'password-reset' && Number(claims.id_user) === Number(id_user) && claims.password_tag === tag(passwordHash);
  } catch { return false; }
}
