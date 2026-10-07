import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTransportOptions } from '../src/services/emailServices.js';

test('SMTP de staging exige STARTTLS e autenticação separada', () => {
  const options = createTransportOptions({ SMTP_HOST: 'mailpit', SMTP_PORT: '1025', SMTP_USER: 'test-user', SMTP_PASSWORD: 'test-password' });
  assert.equal(options.host, 'mailpit');
  assert.equal(options.port, 1025);
  assert.equal(options.secure, false);
  assert.equal(options.requireTLS, true);
  assert.equal(options.auth.user, 'test-user');
  assert.equal(options.auth.pass, 'test-password');
});

test('configuração Gmail anterior continua disponível sem SMTP_HOST', () => {
  const options = createTransportOptions({ EMAIL_CONTATO: 'sender@example.invalid', SENHA_CONTATO: 'test-password' });
  assert.equal(options.service, 'gmail');
  assert.equal(options.auth.user, 'sender@example.invalid');
});
