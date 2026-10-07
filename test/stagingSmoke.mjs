import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '../.env.staging' });
const db = await mysql.createConnection({ host: '127.0.0.1', port: 3308, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const base = 'http://127.0.0.1:3334';
const goodOrigin = 'https://localhost:3443';
const request = async (path, { method = 'GET', token, origin, body, cookie } = {}) => {
  const response = await fetch(base + path, { method, headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}),
    ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const raw = await response.text();
  let data; try { data = JSON.parse(raw); } catch { data = raw; }
  return { status: response.status, data, headers: response.headers };
};
const [[a], [b]] = await Promise.all(['A', 'B'].map(async label => {
  const [rows] = await db.query('SELECT id_igreja FROM igreja WHERE nome = ?', [`STAGING IGREJA ${label}`]);
  return rows;
}));
const login = async label => request('/login', { method: 'POST', origin: goodOrigin, body: { email: `staging-${label.toLowerCase()}@example.invalid`, senha: 'senha-de-staging-123' } });
try {
  const loginA = await login('A'), loginB = await login('B');
  assert.equal(loginA.status, 200); assert.equal(loginB.status, 200);
  const tokenA = loginA.data.token, tokenB = loginB.data.token;
  const cookie = loginA.headers.get('set-cookie');
  for (const marker of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) assert.ok(cookie.includes(marker), marker);
  assert.equal((await request(`/financas/${a.id_igreja}`, { cookie: cookie.split(';')[0], origin: goodOrigin })).status, 200);
  const foreign = await request(`/financas/${a.id_igreja}`, { token: tokenA, origin: 'https://stranger.example.invalid' });
  assert.equal(foreign.status, 403); assert.equal(foreign.headers.get('access-control-allow-origin'), null);
  const preflight = await request('/financas', { method: 'OPTIONS', origin: goodOrigin });
  assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');
  assert.equal(preflight.headers.get('access-control-allow-origin'), goodOrigin);
  const forged = jwt.sign({ infoUser: { id_login: loginA.data.user.id_user, id_igreja: a.id_igreja } }, 'unrelated-staging-secret-with-enough-length', { algorithm: 'HS256' });
  assert.equal((await request(`/financas/${a.id_igreja}`, { token: forged })).status, 401);
  const modules = [
    ['usuários', '/cadastro/obreiros/'], ['membros', '/membro/igreja/'], ['departamentos', '/departamento/'],
    ['visitantes', '/visitante/'], ['finanças', '/financas/'], ['estoque', '/estoque/'],
    ['pedidos', '/pedido/'], ['eventos', '/evento/'], ['avisos', '/avisos/'], ['igrejas', '/igreja/'],
  ];
  const results = [];
  for (const [name, prefix] of modules) {
    const pathA = prefix + a.id_igreja, pathB = prefix + b.id_igreja;
    const statuses = [
      (await request(pathA, { token: tokenA })).status,
      (await request(pathB, { token: tokenA })).status,
      (await request(pathB, { token: tokenB })).status,
      (await request(pathA, { token: tokenB })).status,
      (await request(pathA)).status,
    ];
    assert.ok(statuses[0] >= 200 && statuses[0] < 300, `${name} A→A ${statuses[0]}`);
    assert.equal(statuses[1], 403, `${name} A→B`);
    assert.ok(statuses[2] >= 200 && statuses[2] < 300, `${name} B→B ${statuses[2]}`);
    assert.equal(statuses[3], 403, `${name} B→A`);
    assert.equal(statuses[4], 401, `${name} anônimo`);
    results.push(`${name}: A/A e B/B permitidos; cruzado e anônimo negados`);
  }
  const [members] = await db.query('SELECT id_membro,id_igreja FROM membro WHERE id_igreja IN (?,?)', [a.id_igreja, b.id_igreja]);
  const memberB = members.find(x => x.id_igreja === b.id_igreja);
  assert.equal((await request('/mover/membro', { method: 'PUT', token: tokenA, origin: goodOrigin, body: { id_membro: memberB.id_membro, nova_igreja_id: a.id_igreja } })).status, 403);
  const before = (await request(`/financas/saldo/${a.id_igreja}`, { token: tokenA })).data.saldo;
  const entry = await request('/financas', { method: 'POST', token: tokenA, origin: goodOrigin,
    body: { tipo: 'Entrada', categoria: 'Oferta Simples', valor: '5.00', descricao: 'Staging', data: '2026-10-06', id_igreja: a.id_igreja } });
  assert.equal(entry.status, 201);
  assert.equal(Number((await request(`/financas/saldo/${a.id_igreja}`, { token: tokenA })).data.saldo), Number(before) + 5);
  const editEntry = await request(`/financas/${entry.data.financasId}/${a.id_igreja}`, { method: 'PUT', token: tokenA, origin: goodOrigin,
    body: { tipo: 'Entrada', categoria: 'Oferta Simples', valor: '7.00', descricao: 'Staging', data: '2026-10-06' } });
  assert.equal(editEntry.status, 200);
  assert.equal(Number((await request(`/financas/saldo/${a.id_igreja}`, { token: tokenA })).data.saldo), Number(before) + 7);
  const outgoing = await request('/financas', { method: 'POST', token: tokenA, origin: goodOrigin,
    body: { tipo: 'Saída', categoria: 'Oferta Simples', valor: '3.00', descricao: 'Staging', data: '2026-10-06', id_igreja: a.id_igreja } });
  assert.equal(outgoing.status, 201);
  assert.equal(Number((await request(`/financas/saldo/${a.id_igreja}`, { token: tokenA })).data.saldo), Number(before) + 4);
  const editOutgoing = await request(`/financas/${outgoing.data.financasId}/${a.id_igreja}`, { method: 'PUT', token: tokenA, origin: goodOrigin,
    body: { tipo: 'Saída', categoria: 'Oferta Simples', valor: '4.00', descricao: 'Staging', data: '2026-10-06' } });
  assert.equal(editOutgoing.status, 200);
  assert.equal(Number((await request(`/financas/saldo/${a.id_igreja}`, { token: tokenA })).data.saldo), Number(before) + 3);
  assert.equal((await request('/financas', { method: 'POST', token: tokenA, origin: goodOrigin,
    body: { tipo: 'Entrada', categoria: 'Oferta Simples', valor: '-1.00', descricao: 'Inválido', data: '2026-10-06', id_igreja: a.id_igreja } })).status, 400);
  const logout = await request('/login/logout', { method: 'POST', cookie: cookie.split(';')[0], origin: goodOrigin });
  assert.equal(logout.status, 200); assert.ok(logout.headers.get('set-cookie')?.includes('Expires='));
  console.log(JSON.stringify({ modules: results, cors: 'PASS', cookieFlags: 'PASS', logout: 'PASS', finance: 'PASS', movementDenied: 'PASS' }));
} finally { await db.end(); }
