import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChurchFactory } from '../src/services/igrejaServices.js';

function fixture(failBalance = false, hasTrigger = false) {
  const calls = [];
  const conn = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    end: async () => calls.push('end'),
    query: async (sql, values) => {
      calls.push([sql, values]);
      if (sql.startsWith('SELECT id_saldo')) return [hasTrigger ? [{ id_saldo: 7 }] : []];
      if (sql.startsWith('INSERT INTO saldo') && failBalance) throw new Error('Saldo indisponível');
      return [{ insertId: 42 }];
    },
  };
  return { database: { connect: async () => conn }, calls };
}

test('igreja nova recebe saldo zero na mesma transação', async () => {
  const { database, calls } = fixture();
  const id = await createChurchFactory(database)('Nova', '1', null, null, 'M', '1', 'Rua', 'B', 'C', null);
  assert.equal(id, 42);
  assert.ok(calls.some(call => Array.isArray(call) && call[0].startsWith('INSERT INTO saldo') && call[1][1] === 42));
  assert.ok(calls.includes('commit'));
});

test('falha ao criar saldo desfaz a igreja', async () => {
  const { database, calls } = fixture(true);
  await assert.rejects(createChurchFactory(database)('Nova', '1', null, null, 'M', '1', 'Rua', 'B', 'C', null));
  assert.ok(calls.includes('rollback'));
  assert.ok(!calls.includes('commit'));
});

test('trigger existente não cria saldo duplicado', async () => {
  const { database, calls } = fixture(false, true);
  await createChurchFactory(database)('Nova', '1', null, null, 'M', '1', 'Rua', 'B', 'C', null);
  assert.ok(!calls.some(call => Array.isArray(call) && call[0].startsWith('INSERT INTO saldo')));
});
