// Aplica as migrations pendentes de src/repository/migrations, em ordem, e registra
// cada uma em schema_migrations. Uso: npm run migrate  (ou --dry-run para só listar).
import mysql2 from 'mysql2/promise';
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const migrationsDir = fileURLToPath(new URL('../repository/migrations/', import.meta.url));

// Bancos criados antes de schema_migrations: detecta pelo schema o que já foi aplicado,
// para não reaplicar um ALTER que já rodou.
const alreadyApplied = {
  '001_nullable_report_owner.sql': async db => (await column(db, 'bug_reports', 'id_user'))?.IS_NULLABLE === 'YES',
  '002_backfill_missing_balances.sql': async () => false, // idempotente: pode rodar de novo
  '003_session_version.sql': async db => !!(await column(db, 'user', 'session_version')),
  '004_rate_limits.sql': async db => !!(await table(db, 'rate_limits')),
  '005_unique_balance_church.sql': async db => {
    const [rows] = await db.query("SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'saldo' AND index_name = 'uq_saldo_igreja' LIMIT 1");
    return rows.length > 0;
  },
};

async function column(db, tableName, columnName) {
  const [rows] = await db.query('SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?', [tableName, columnName]);
  return rows[0];
}

async function table(db, tableName) {
  const [rows] = await db.query('SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [tableName]);
  return rows.length > 0;
}

export async function migrate(db, { dryRun = false, log = console.log } = {}) {
  const files = (await readdir(migrationsDir)).filter(name => /^\d{3}_.+\.sql$/.test(name)).sort();
  const firstRun = !await table(db, 'schema_migrations');
  if (!dryRun) {
    await db.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
  }
  const [rows] = firstRun ? [[]] : await db.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map(row => row.name));
  const applied = [];
  for (const name of files) {
    if (done.has(name)) continue;
    if (firstRun && await alreadyApplied[name]?.(db)) {
      log(`Já presente no schema${dryRun ? '' : ', registrando'}: ${name}`);
      if (!dryRun) await db.query('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
      continue;
    }
    log(`${dryRun ? 'Pendente' : 'Aplicando'}: ${name}`);
    if (!dryRun) {
      await db.query(await readFile(resolve(migrationsDir, name), 'utf8'));
      await db.query('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
    }
    applied.push(name);
  }
  log(applied.length ? `${dryRun ? 'Pendentes' : 'Aplicadas'}: ${applied.length}` : 'Nenhuma migration pendente.');
  return applied;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`Configuração de banco ausente: ${key}`);
  }
  const db = await mysql2.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_MIGRATION_USER || process.env.DB_USER,
    password: process.env.DB_MIGRATION_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  try { await migrate(db, { dryRun: process.argv.includes('--dry-run') }); }
  finally { await db.end(); }
}
