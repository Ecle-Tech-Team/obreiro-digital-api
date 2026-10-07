import banco from './connection.js';
import { recordTables } from '../middlewares/security.js';
import { createHash } from 'node:crypto';

async function one(sql, values) {
  const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, values);
    return rows[0];
  } finally {
    await conn.end();
  }
}

async function getUser(id) {
  const row = await one('SELECT id_user, id_igreja, cargo, email, nome, senha, session_version FROM user WHERE id_user = ?', [id]);
  if (!row) return undefined;
  const auth_tag = createHash('sha256').update(row.senha).digest('hex');
  delete row.senha;
  return { ...row, auth_tag };
}

async function getChurch(id) {
  return one('SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja = ?', [id]);
}

async function getOwner(table, id) {
  const entry = Object.values(recordTables).find(([name]) => name === table);
  if (!entry) throw new Error('Tabela de autorização inválida.');
  const row = await one(`SELECT id_igreja FROM ${entry[0]} WHERE ${entry[1]} = ?`, [id]);
  return row?.id_igreja;
}

async function countUsers(id_igreja) {
  const row = await one('SELECT COUNT(*) AS total FROM user WHERE id_igreja = ?', [id_igreja]);
  return Number(row.total);
}

async function listVisibleChurches(user) {
  const conn = await banco.connect();
  try {
    const isMatriz = user.cargo === 'Pastor Matriz' || user.cargo === 'Obreiro Matriz';
    const [rows] = await conn.query('SELECT id_igreja, nome, id_matriz FROM igreja WHERE id_igreja = ? OR (id_matriz = ? AND ? = 1)',
      [user.id_igreja, user.id_igreja, isMatriz ? 1 : 0]);
    return rows;
  } finally { await conn.end(); }
}

export default { getUser, getChurch, getOwner, countUsers, listVisibleChurches };
