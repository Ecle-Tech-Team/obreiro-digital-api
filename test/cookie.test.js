import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import verifyJWT from '../src/middlewares/jwt.js';
import { generateToken } from '../src/helpers/userFeatures.js';

test('cookie HttpOnly autentica; escrita com cookie exige origem permitida', async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const token = generateToken({ id_user: 1, id_igreja: 10, email: 'test@example.invalid', auth_tag: 'test' });
  const app = express();
  app.use(verifyJWT);
  app.all('*', (req, res) => res.json(req.user));
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const cookie = `od_session=${token}`;
    assert.equal((await fetch(base, { headers: { Cookie: cookie } })).status, 200);
    assert.equal((await fetch(base, { method: 'POST', headers: { Cookie: cookie, Origin: 'https://attacker.invalid' } })).status, 403);
    assert.equal((await fetch(base, { method: 'POST', headers: { Cookie: cookie, Origin: 'http://localhost:3000' } })).status, 200);
    assert.equal((await fetch(base)).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
