import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { createSecurityGate } from '../src/middlewares/security.js';
import { generateRegistrationToken } from '../src/helpers/userFeatures.js';
import { randomBytes } from 'node:crypto';

const users = {
  1: { id_user: 1, id_igreja: 10, cargo: 'Pastor' },
  2: { id_user: 2, id_igreja: 20, cargo: 'Pastor' },
  3: { id_user: 3, id_igreja: 10, cargo: 'Obreiro' },
  4: { id_user: 4, id_igreja: 30, cargo: 'Obreiro Matriz' },
  5: { id_user: 5, id_igreja: 30, cargo: 'Pastor Matriz' },
};
const owners = {
  financas: { 101: 10, 201: 20 }, membro: { 101: 10, 201: 20, 301: 31 },
  departamentos: { 101: 10, 201: 20 }, estoque: { 101: 10, 201: 20 },
  pedidos: { 101: 10, 201: 20 }, eventos: { 101: 10, 201: 20 }, avisos: { 101: 10, 201: 20 },
};

async function runRequest(method, path, userId, body = {}) {
  let writes = 0;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { if (userId) req.user = { ...users[userId] }; next(); });
  app.use(createSecurityGate({
    getUser: async id => users[id],
    getOwner: async (table, id) => owners[table]?.[id],
    getChurch: async id => ({ id_igreja: Number(id), id_matriz: Number(id) === 10 ? 1 : Number(id) === 31 ? 30 : null }),
    countUsers: async () => 0,
  }));
  app.all('*', (_req, res) => { writes++; res.json({ ok: true }); });
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { 'content-type': 'application/json' },
      ...(['GET', 'HEAD'].includes(method) ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, writes };
  } finally { await new Promise(resolve => server.close(resolve)); }
}

test('finanças: autenticação, igreja A/B e papel', async () => {
  assert.deepEqual(await runRequest('GET', '/financas/10'), { status: 401, writes: 0 });
  assert.deepEqual(await runRequest('GET', '/financas/10', 1), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('GET', '/financas/20', 1), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('GET', '/financas/20', 2), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('GET', '/financas/10', 2), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('POST', '/financas', 3, { id_igreja: 10 }), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('POST', '/financas', 1, { id_igreja: 20 }), { status: 403, writes: 0 });
});

test('mutações verificam dono real do registro e não aceitam troca de igreja', async () => {
  assert.deepEqual(await runRequest('PUT', '/financas/101/10', 1), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('PUT', '/financas/201/10', 1), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('PUT', '/financas/101/20', 1), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('DELETE', '/membro/201', 1), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('DELETE', '/membro/101', 1), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('DELETE', '/membro/101', 2), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('PUT', '/membro/101/10', 1, { id_departamento: 201 }), { status: 403, writes: 0 });
});

test('cadastro público não pode criar cargo em igreja existente', async () => {
  assert.deepEqual(await runRequest('POST', '/cadastro', undefined, { cargo: 'Pastor Matriz', id_igreja: 10 }), { status: 401, writes: 0 });
  assert.deepEqual(await runRequest('DELETE', '/cadastro/2', 1), { status: 403, writes: 0 });
});

test('cadastro inicial exige prova emitida para a própria igreja', async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const registration_token = generateRegistrationToken(30);
  assert.deepEqual(await runRequest('POST', '/cadastro', undefined, { id_igreja: 30, cargo: 'Pastor Matriz', registration_token }), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('POST', '/cadastro', undefined, { id_igreja: 20, cargo: 'Pastor Matriz', registration_token }), { status: 403, writes: 0 });
});

test('filial aceita sua matriz na semana e rejeita matriz alheia', async () => {
  assert.deepEqual(await runRequest('GET', '/evento/semana/10/1', 1), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('GET', '/evento/semana/10/2', 1), { status: 403, writes: 0 });
});

test('publicação global exige pastor matriz autenticado', async () => {
  assert.deepEqual(await runRequest('POST', '/evento', 4, { is_global: true }), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('POST', '/avisos', 4, { is_global: true }), { status: 403, writes: 0 });
});

test('movimentação exige pastor matriz, origem visível e destino da mesma hierarquia', async () => {
  assert.deepEqual(await runRequest('PUT', '/mover/membro', 5, { id_membro: 301, nova_igreja_id: 30 }), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('PUT', '/mover/membro', 4, { id_membro: 101, nova_igreja_id: 30 }), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('PUT', '/mover/membro', 5, { id_membro: 201, nova_igreja_id: 30 }), { status: 403, writes: 0 });
  assert.deepEqual(await runRequest('PUT', '/mover/membro', 5, { id_membro: 101, nova_igreja_id: 20 }), { status: 403, writes: 0 });
});

test('estoque, pedidos, eventos, avisos e visitantes isolam igrejas A e B', async () => {
  for (const module of ['estoque', 'pedido', 'evento', 'avisos', 'visitante']) {
    assert.deepEqual(await runRequest('GET', `/${module}/10`, 1), { status: 200, writes: 1 });
    assert.deepEqual(await runRequest('GET', `/${module}/20`, 1), { status: 403, writes: 0 });
    assert.deepEqual(await runRequest('GET', `/${module}/20`, 2), { status: 200, writes: 1 });
    assert.deepEqual(await runRequest('GET', `/${module}/10`, 2), { status: 403, writes: 0 });
    assert.deepEqual(await runRequest('GET', `/${module}/10`), { status: 401, writes: 0 });
  }
  for (const module of ['estoque', 'pedido', 'evento', 'avisos']) {
    assert.deepEqual(await runRequest('DELETE', `/${module}/101`, 1), { status: 200, writes: 1 });
    assert.deepEqual(await runRequest('DELETE', `/${module}/201`, 1), { status: 403, writes: 0 });
  }
});

test('catálogo local de departamentos continua acessível somente com JWT', async () => {
  assert.deepEqual(await runRequest('GET', '/departamento', 1), { status: 200, writes: 1 });
  assert.deepEqual(await runRequest('GET', '/departamento'), { status: 401, writes: 0 });
});
