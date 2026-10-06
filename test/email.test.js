import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../src/services/emailServices.js';

test('texto do usuário não cria HTML no email de suporte', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
