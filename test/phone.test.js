import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, PhoneValidationError } from '../src/helpers/phone.js';

test('celular aceita formatos comuns e guarda só dígitos', () => {
  assert.equal(normalizePhone('(11) 98765-4321'), '11987654321');
  assert.equal(normalizePhone('11987654321'), '11987654321');
  assert.equal(normalizePhone('(11) 3456-7890'), '1134567890');
  assert.equal(normalizePhone('+55 11 98765-4321'), '5511987654321');
  assert.equal(normalizePhone(''), null);
  assert.equal(normalizePhone(undefined), null);
});

test('celular rejeita números sem DDD ou com tamanho errado', () => {
  for (const value of ['98765432', '123', '119876543210000', 'abc']) {
    assert.throws(() => normalizePhone(value), PhoneValidationError, value);
  }
});
