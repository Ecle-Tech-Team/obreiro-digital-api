import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/middlewares/rateLimit.js';

test('limite por origem e rota retorna 429 e libera após a janela', () => {
  let time = 0;
  const limit = createRateLimiter({ max: 2, windowMs: 1000, now: () => time });
  const response = { code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json() { return this; } };
  const request = { ip: '127.0.0.1', path: '/login' };
  let allowed = 0;
  limit(request, response, () => allowed++);
  limit(request, response, () => allowed++);
  limit(request, response, () => allowed++);
  assert.equal(allowed, 2); assert.equal(response.code, 429);
  time = 1001; response.code = 200;
  limit(request, response, () => allowed++);
  assert.equal(allowed, 3); assert.equal(response.code, 200);
});
