import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { hashPassword } from '../src/helpers/password.js';

dotenv.config({ path: '../.env.staging' });
const database = process.argv[3] || process.env.DB_NAME;
const restore = database === 'obreiro_staging_restore';
const connection = await mysql.createConnection({
  host: '127.0.0.1', port: 3308, user: restore ? 'root' : process.env.DB_USER,
  password: restore ? process.env.MYSQL_ROOT_PASSWORD : process.env.DB_PASSWORD, database,
});

try {
  if (process.argv[2] === 'seed') {
    const [existing] = await connection.query('SELECT COUNT(*) AS total FROM igreja');
    if (existing[0].total !== 0) throw new Error('Staging seed exige banco vazio.');
    for (const label of ['A', 'B']) {
      const [church] = await connection.query('INSERT INTO igreja(nome,cnpj,cep,endereco,bairro,cidade) VALUES (?,?,?,?,?,?)',
        [`STAGING IGREJA ${label}`, `STAGING-${label}`, '00000000', 'Rua de teste', 'Centro', 'Teste']);
      await connection.query('INSERT INTO user(cod_membro,nome,email,senha,birth,cargo,id_igreja) VALUES (?,?,?,?,?,?,?)',
        [`STAGING-${label}`, `Pastor ${label}`, `staging-${label.toLowerCase()}@example.invalid`,
          await hashPassword('senha-de-staging-123'), '2000-01-01', 'Pastor', church.insertId]);
      const [department] = await connection.query('INSERT INTO departamentos(nome,birth,id_igreja) VALUES (?,?,?)',
        [`Departamento ${label}`, '2000-01-01', church.insertId]);
      await connection.query('INSERT INTO membro(cod_membro,nome,birth,novo_convertido,id_departamento,id_igreja) VALUES (?,?,?,?,?,?)',
        [`STAGING-${label}`, `Membro ${label}`, '2000-01-01', 'Sim', department.insertId, church.insertId]);
      if (label === 'A') {
        const [balance] = await connection.query('INSERT INTO saldo(saldo_atual,data_atualizacao,id_igreja) VALUES (?,?,?)',
          ['10.00', '2026-10-06', church.insertId]);
        await connection.query('INSERT INTO financas(tipo,categoria,valor,descricao,data,id_saldo,id_igreja) VALUES (?,?,?,?,?,?,?)',
          ['Entrada', 'Oferta Simples', '10.00', 'Lançamento sintético', '2026-10-06', balance.insertId, church.insertId]);
      }
    }
    await connection.query('INSERT INTO user(cod_membro,nome,email,senha,birth,cargo,id_igreja) VALUES (?,?,?,?,?,?,(SELECT id_igreja FROM igreja WHERE nome = ?))',
      ['STAGING-LEGACY', 'Usuário legado', 'staging-legacy@example.invalid', 'senha-legada', '2000-01-01', 'Obreiro', 'STAGING IGREJA A']);
    console.log('Fixture sintética criada.');
  } else if (process.argv[2] === 'inspect') {
    const tables = ['igreja', 'user', 'membro', 'departamentos', 'visitante', 'financas', 'saldo', 'pedidos', 'eventos', 'estoque', 'avisos'];
    const counts = {};
    for (const table of tables) counts[table] = (await connection.query(`SELECT COUNT(*) AS total FROM ${table}`))[0][0].total;
    const [balances] = await connection.query('SELECT i.id_igreja, COUNT(s.id_saldo) AS saldos FROM igreja i LEFT JOIN saldo s ON s.id_igreja=i.id_igreja GROUP BY i.id_igreja ORDER BY i.id_igreja');
    const [column] = await connection.query("SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bug_reports' AND COLUMN_NAME = 'id_user'", [database]);
    console.log(JSON.stringify({ database, counts, balances, reportOwnerNullable: column[0]?.IS_NULLABLE }));
  } else if (process.argv[2] === 'add-legacy') {
    await connection.query('INSERT INTO user(cod_membro,nome,email,senha,birth,cargo,id_igreja) VALUES (?,?,?,?,?,?,(SELECT id_igreja FROM igreja WHERE nome = ?))',
      ['STG-MIGRATION', 'Migração de teste', 'staging-migration@example.invalid', 'senha-legada-2', '2000-01-01', 'Obreiro', 'STAGING IGREJA A']);
    console.log('Conta legada sintética para migration criada.');
  } else if (process.argv[2] === 'password-status') {
    const [rows] = await connection.query("SELECT COUNT(*) AS total, SUM(senha LIKE '$scrypt$%') AS migrated, SUM(senha NOT LIKE '$scrypt$%') AS legacy, SUM(senha IS NULL OR senha='') AS invalid FROM user");
    console.log(JSON.stringify(rows[0]));
  } else if (process.argv[2] === 'legacy-owner') {
    if (!restore) throw new Error('Simulação de schema legado permitida apenas na cópia restaurada.');
    await connection.query('ALTER TABLE bug_reports MODIFY COLUMN id_user INT NOT NULL');
    console.log('Coluna do relatório na cópia isolada alterada para formato legado NOT NULL.');
  } else if (process.argv[2] === 'reconcile') {
    const [rows] = await connection.query(`SELECT i.id_igreja, i.nome,
      COALESCE(s.balance_rows,0) AS balance_rows, s.recorded,
      COALESCE(f.entries,0) AS entries, COALESCE(f.calculated,0) AS calculated,
      COALESCE(f.wrong_links,0) AS wrong_links
      FROM igreja i
      LEFT JOIN (SELECT id_igreja,COUNT(*) AS balance_rows,MAX(saldo_atual) AS recorded FROM saldo GROUP BY id_igreja) s ON s.id_igreja=i.id_igreja
      LEFT JOIN (SELECT f.id_igreja,COUNT(*) AS entries,
        SUM(CASE WHEN f.tipo='Entrada' THEN f.valor WHEN f.tipo='Saída' THEN -f.valor ELSE 0 END) AS calculated,
        SUM(CASE WHEN s.id_saldo IS NULL OR s.id_igreja<>f.id_igreja OR f.tipo IS NULL THEN 1 ELSE 0 END) AS wrong_links
        FROM financas f LEFT JOIN saldo s ON s.id_saldo=f.id_saldo GROUP BY f.id_igreja) f ON f.id_igreja=i.id_igreja
      ORDER BY i.id_igreja`);
    console.log(JSON.stringify(rows));
  } else throw new Error('Use seed, inspect ou reconcile.');
} finally { await connection.end(); }
