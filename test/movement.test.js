import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMovementService } from '../src/controllers/movimentacaoController.js';

function database(owner, destinationParent = 30) {
  const calls = [];
  const conn = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    end: async () => calls.push('end'),
    query: async (sql, values) => {
      calls.push([sql, values]);
      if (sql.startsWith('SELECT id_igreja FROM')) return [[{ id_igreja: owner }]];
      if (sql.startsWith('SELECT id_igreja, id_matriz FROM igreja')) return [[
        { id_igreja: owner, id_matriz: owner === 30 ? null : 30 },
        { id_igreja: values[1], id_matriz: destinationParent },
      ]];
      return [{ affectedRows: 1 }];
    },
  };
  return { connect: async () => conn, calls };
}

test('movimentação de membro usa origem no UPDATE e limpa departamento', async () => {
  const db = database(31);
  await createMovementService(db).moveMember(101, 32, 30);
  assert.equal(db.calls.at(-2), 'commit');
  assert.ok(db.calls.some(call => Array.isArray(call) && call[0].includes('id_departamento = NULL') && call[0].includes('AND id_igreja = ?') && call[1][2] === 31));
});

test('movimentação rejeita igreja alheia e desfaz transação', async () => {
  const db = database(20, 20);
  await assert.rejects(createMovementService(db).moveUser(101, 21, 30));
  assert.ok(db.calls.includes('rollback'));
  assert.ok(!db.calls.some(call => Array.isArray(call) && call[0].startsWith('UPDATE user')));
});
