import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { issueResetToken, verifyResetToken } from '../src/helpers/resetToken.js';

test('token de recuperação vincula conta e senha atual e expira', () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const oldHash = '$scrypt$' + randomBytes(80).toString('hex');
  const token = issueResetToken(7, oldHash);
  assert.equal(verifyResetToken(token, 7, oldHash), true);
  assert.equal(verifyResetToken(token, 8, oldHash), false);
  assert.equal(verifyResetToken(token, 7, 'senha-substituída'), false);
  assert.equal(verifyResetToken(token + 'x', 7, oldHash), false);
});
