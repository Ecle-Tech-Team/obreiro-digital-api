import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate } from '../src/scripts/migrate.js';

// Banco falso: responde às consultas de schema conforme `schema` e grava o que foi executado.
function fakeDb({ hasTable = false, recorded = [], schema = {} } = {}) {
  const executed = [];
  const registered = [...recorded];
  let tableExists = hasTable;
  return {
    executed, registered,
    async query(sql, params = []) {
      if (sql.includes('information_schema.tables')) {
        const name = params[0];
        if (name === 'schema_migrations') return [tableExists ? [{}] : []];
        return [schema.tables?.includes(name) ? [{}] : []];
      }
      if (sql.includes('DATA_TYPE')) return [[{ DATA_TYPE: schema.phoneVarchar ? 'varchar' : 'int' }]];
      if (sql.includes('information_schema.columns')) {
        const key = `${params[0]}.${params[1]}`;
        return [key in (schema.columns || {}) ? [{ IS_NULLABLE: schema.columns[key] }] : []];
      }
      if (sql.includes('information_schema.statistics')) return [schema.uniqueSaldo ? [{}] : []];
      if (sql.startsWith('CREATE TABLE IF NOT EXISTS schema_migrations')) { tableExists = true; return [[]]; }
      if (sql.startsWith('SELECT name FROM schema_migrations')) return [registered.map(name => ({ name }))];
      if (sql.startsWith('INSERT INTO schema_migrations')) { registered.push(params[0]); return [{}]; }
      executed.push(sql);
      return [[]];
    },
  };
}

const quiet = { log: () => {} };

test('banco antigo sem registro: não reaplica o que o schema já tem', async () => {
  const db = fakeDb({ schema: {
    columns: { 'bug_reports.id_user': 'YES', 'user.session_version': 'NO' },
    tables: ['rate_limits'], uniqueSaldo: true, phoneVarchar: true,
  } });
  const applied = await migrate(db, quiet);
  assert.deepEqual(applied, ['002_backfill_missing_balances.sql']); // só a idempotente roda
  assert.equal(db.registered.length, 6);
  assert.equal(db.executed.length, 1);
});

test('banco antigo parcialmente migrado: aplica só as que faltam', async () => {
  const db = fakeDb({ schema: { columns: { 'bug_reports.id_user': 'NO' } } });
  const applied = await migrate(db, quiet);
  assert.deepEqual(applied, ['001_nullable_report_owner.sql', '002_backfill_missing_balances.sql', '003_session_version.sql', '004_rate_limits.sql', '005_unique_balance_church.sql', '006_member_phone_text.sql']);
});

test('banco com registro completo: nada a fazer', async () => {
  const all = ['001_nullable_report_owner.sql', '002_backfill_missing_balances.sql', '003_session_version.sql', '004_rate_limits.sql', '005_unique_balance_church.sql', '006_member_phone_text.sql'];
  const db = fakeDb({ hasTable: true, recorded: all });
  assert.deepEqual(await migrate(db, quiet), []);
  assert.equal(db.executed.length, 0);
});

test('dry-run não altera o banco', async () => {
  const db = fakeDb({ schema: {} });
  const pending = await migrate(db, { ...quiet, dryRun: true });
  assert.equal(pending.length, 6);
  assert.equal(db.executed.length, 0);
  assert.equal(db.registered.length, 0);
});
