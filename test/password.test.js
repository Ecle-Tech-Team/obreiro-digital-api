import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/helpers/password.js';

test('senhas usam hash com salt e verificam sem devolver texto original', async () => {
  const one = await hashPassword('senha válida 123');
  const two = await hashPassword('senha válida 123');
  assert.notEqual(one, two);
  assert(!one.includes('senha válida'));
  assert.equal(await verifyPassword('senha válida 123', one), true);
  assert.equal(await verifyPassword('incorreta', one), false);
});

test('conta legada autentica para migração e formato inválido falha', async () => {
  assert.equal(await verifyPassword('legado', 'legado'), true);
  assert.equal(await verifyPassword('outro', 'legado'), false);
  assert.equal(await verifyPassword('qualquer', '$scrypt$invalido'), false);
});
