import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer, request } from 'node:http';
import { randomBytes } from 'node:crypto';
import verifyJWT from '../src/middlewares/jwt.js';
import { generateToken } from '../src/helpers/userFeatures.js';
import { cookieSecure } from '../src/helpers/origin.js';

test('atrás do proxy: escrita com cookie aceita a própria origem e recusa outras', async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  process.env.CORS_ORIGINS = 'https://obreiro.example.invalid';
  const token = generateToken({ id_user: 1, id_igreja: 10, email: 'test@example.invalid', auth_tag: 'test' });
  const app = express();
  app.set('trust proxy', 'loopback');
  app.use(verifyJWT);
  app.all('*', (req, res) => res.json({ ok: true }));
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  // http.request (e não fetch) porque o teste precisa definir o cabeçalho Host.
  const post = headers => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method: 'POST', path: '/', headers: { Cookie: `od_session=${token}`, ...headers } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject);
    req.end();
  });
  try {
    // Rede local: o navegador abriu http://truenas.local:8080 e o nginx repassou o Host.
    assert.equal(await post({ Host: 'truenas.local:8080', Origin: 'http://truenas.local:8080' }), 200);
    assert.equal(await post({ Host: '192.168.0.20:8080', Origin: 'http://192.168.0.20:8080' }), 200);
    // Túnel HTTPS: o proxy informa o protocolo original.
    assert.equal(await post({ Host: 'obreiro.example.invalid', 'X-Forwarded-Proto': 'https', Origin: 'https://obreiro.example.invalid' }), 200);
    // Outro site, protocolo trocado ou sem Origin: recusado.
    assert.equal(await post({ Host: 'truenas.local:8080', Origin: 'https://attacker.invalid' }), 403);
    assert.equal(await post({ Host: 'truenas.local:8080', Origin: 'https://truenas.local:8080' }), 403);
    assert.equal(await post({ Host: 'truenas.local:8080' }), 403);
    // Origem da lista continua aceita mesmo vinda de outro endereço.
    assert.equal(await post({ Host: 'api.interna:3333', Origin: 'https://obreiro.example.invalid' }), 200);
  } finally {
    delete process.env.CORS_ORIGINS;
    await new Promise(resolve => server.close(resolve));
  }
});

test('COOKIE_SECURE: auto segue o protocolo; sem a variável vale o NODE_ENV', () => {
  const env = { COOKIE_SECURE: process.env.COOKIE_SECURE, NODE_ENV: process.env.NODE_ENV };
  try {
    process.env.COOKIE_SECURE = 'auto';
    assert.equal(cookieSecure({ secure: true }), true);
    assert.equal(cookieSecure({ secure: false }), false);
    process.env.COOKIE_SECURE = 'false';
    assert.equal(cookieSecure({ secure: true }), false);
    process.env.COOKIE_SECURE = 'true';
    assert.equal(cookieSecure({ secure: false }), true);
    delete process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'production';
    assert.equal(cookieSecure({ secure: false }), true);
    process.env.NODE_ENV = 'development';
    assert.equal(cookieSecure({ secure: true }), false);
  } finally {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
