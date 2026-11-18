import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { generateResetCode, hashResetCode, isResetCode, resetCodeMatches } from '../src/helpers/resetCode.js';

test('código de recuperação: 6 dígitos, vinculado à conta e conferido pelo HMAC', () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  for (let i = 0; i < 50; i += 1) assert.match(generateResetCode(), /^\d{6}$/);
  assert.equal(isResetCode('012345'), true);
  for (const invalid of ['12345', '1234567', '12a456', ' 123456', 123456, null]) assert.equal(isResetCode(invalid), false);

  const stored = hashResetCode(7, '042137');
  assert.equal(stored.length, 64);
  assert.notEqual(stored, hashResetCode(8, '042137'), 'o mesmo código em outra conta gera outro hash');
  assert.equal(resetCodeMatches(stored, 7, '042137'), true);
  assert.equal(resetCodeMatches(stored, 8, '042137'), false);
  assert.equal(resetCodeMatches(stored, 7, '042138'), false);
  assert.equal(resetCodeMatches('curto', 7, '042137'), false);

  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  assert.equal(resetCodeMatches(stored, 7, '042137'), false, 'trocar o segredo invalida códigos antigos');
});
