import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFinancialLedger } from '../src/services/financasServices.js';

function database({ failAfterInsert = false } = {}) {
  const state = { balance: 10000n, entries: [], committed: false, rolledBack: false };
  const conn = {
    async beginTransaction() { this.backup = { balance: state.balance, entries: [...state.entries] }; },
    async commit() { state.committed = true; },
    async rollback() { state.balance = this.backup.balance; state.entries = this.backup.entries; state.rolledBack = true; },
    async end() {},
    async query(sql, values) {
      if (sql.includes('FROM saldo') && sql.includes('FOR UPDATE')) return [[{ id_saldo: 5, saldo_atual: '100.00' }]];
      if (sql.startsWith('INSERT INTO financas')) { state.entries.push(values); if (failAfterInsert) throw new Error('falha simulada'); return [{ insertId: 9 }]; }
      if (sql.startsWith('UPDATE saldo')) { state.balance = BigInt(values[0].replace('.', '')); return [{ affectedRows: 1 }]; }
      throw new Error(`Consulta inesperada: ${sql}`);
    },
  };
  return { state, connect: async () => conn };
}

test('lançamento financeiro usa saldo da igreja e confirma as duas gravações', async () => {
  const db = database();
  const ledger = createFinancialLedger(db);
  assert.equal(await ledger.createFinancas('Entrada', 'Dízimo', '10.25', 'teste', '2026-10-05', 10), 9);
  assert.equal(db.state.balance, 11025n);
  assert.equal(db.state.entries[0].at(-1), 5);
  assert.equal(db.state.entries[0][5], 10);
  assert.equal(db.state.committed, true);
});

test('falha na gravação reverte lançamento e saldo; valor negativo rejeitado', async () => {
  const db = database({ failAfterInsert: true });
  const ledger = createFinancialLedger(db);
  await assert.rejects(ledger.createFinancas('Saída', 'Dízimo', '2.00', 'teste', '2026-10-05', 10));
  assert.equal(db.state.entries.length, 0);
  assert.equal(db.state.balance, 10000n);
  assert.equal(db.state.rolledBack, true);
  await assert.rejects(ledger.createFinancas('Entrada', 'Dízimo', '-2.00', 'teste', '2026-10-05', 10));
});
