// Filiais: a matriz cria a igreja e convida o pastor dela por um link de uso único.
import { createHash, randomBytes } from 'node:crypto';
import banco from '../repository/connection.js';
import { createChurchFactory } from './igrejaServices.js';
import { hashPassword } from '../helpers/password.js';
import { PASTOR_ROLES } from '../helpers/pastorGuard.js';

export const INVITE_DAYS = 7;

export class FilialError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const hashToken = token => createHash('sha256').update(String(token)).digest('hex');
const text = (value, max) => typeof value === 'string' && value.trim() !== '' && value.trim().length <= max;
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''));

export function createFilialService(database) {
  const createIgreja = createChurchFactory(database);

  async function transaction(action) {
    const conn = await database.connect();
    try {
      await conn.beginTransaction();
      const result = await action(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { await conn.end(); }
  }

  // A matriz é a igreja do usuário; o middleware já confirmou que ele é Pastor Matriz de uma igreja sem matriz.
  async function createFilial(id_matriz, data) {
    const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade } = data || {};
    if (![nome, ministerio, endereco, bairro, cidade].every(value => text(value, 150))) throw new FilialError('Preencha nome, ministério, endereço, bairro e cidade.');
    if (!text(cnpj, 20)) throw new FilialError('Informe o CNPJ.');
    if (!text(String(cep ?? ''), 19)) throw new FilialError('Informe o CEP.');
    if (!isDate(data_fundacao)) throw new FilialError('Informe a data de fundação.');
    if (setor !== undefined && setor !== null && String(setor).length > 200) throw new FilialError('Setor muito longo.');
    return createIgreja(nome.trim(), cnpj.trim(), data_fundacao, setor ?? null, ministerio.trim(), String(cep).trim(), endereco.trim(), bairro.trim(), cidade.trim(), id_matriz);
  }

  async function listFiliais(id_matriz) {
    const conn = await database.connect();
    try {
      const [rows] = await conn.query(`SELECT i.id_igreja, i.nome,
          (SELECT COUNT(*) FROM user u WHERE u.id_igreja = i.id_igreja AND u.cargo IN (?)) AS total_pastores,
          (SELECT MAX(c.expira_em) FROM convites c WHERE c.id_igreja = i.id_igreja AND c.usado_em IS NULL
             AND c.revogado_em IS NULL AND c.expira_em > UTC_TIMESTAMP()) AS convite_expira_em
        FROM igreja i WHERE i.id_matriz = ? ORDER BY i.nome`, [PASTOR_ROLES, id_matriz]);
      return rows.map(row => ({ ...row, total_pastores: Number(row.total_pastores) }));
    } finally { await conn.end(); }
  }

  // Gera um convite novo (o anterior pendente deixa de valer). Só enquanto a filial não tem pastor.
  async function createInvite(id_filial, id_matriz, id_user) {
    return transaction(async conn => {
      const [[church]] = await conn.query('SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja = ? FOR UPDATE', [id_filial]);
      if (!church || Number(church.id_matriz) !== Number(id_matriz)) throw new FilialError('Filial não encontrada.', 404);
      const [pastors] = await conn.query('SELECT id_user FROM user WHERE id_igreja = ? AND cargo IN (?) LIMIT 1', [id_filial, PASTOR_ROLES]);
      if (pastors.length) throw new FilialError('Esta filial já tem pastor. Novos usuários são cadastrados pelo pastor dela.', 409);
      await conn.query('UPDATE convites SET revogado_em = UTC_TIMESTAMP() WHERE id_igreja = ? AND usado_em IS NULL AND revogado_em IS NULL', [id_filial]);
      const token = randomBytes(32).toString('base64url');
      await conn.query('INSERT INTO convites (token_hash, id_igreja, criado_por, expira_em) VALUES (?, ?, ?, UTC_TIMESTAMP() + INTERVAL ? DAY)',
        [hashToken(token), id_filial, id_user, INVITE_DAYS]);
      const [[created]] = await conn.query('SELECT expira_em FROM convites WHERE token_hash = ?', [hashToken(token)]);
      return { token, expira_em: created.expira_em };
    });
  }

  async function findValidInvite(conn, token, lock = false) {
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return undefined;
    const [[invite]] = await conn.query(`SELECT c.id_convite, c.id_igreja, i.nome AS igreja, m.nome AS matriz
        FROM convites c JOIN igreja i ON i.id_igreja = c.id_igreja LEFT JOIN igreja m ON m.id_igreja = i.id_matriz
        WHERE c.token_hash = ? AND c.usado_em IS NULL AND c.revogado_em IS NULL AND c.expira_em > UTC_TIMESTAMP()${lock ? ' FOR UPDATE' : ''}`,
      [hashToken(token)]);
    return invite;
  }

  async function getInvite(token) {
    const conn = await database.connect();
    try {
      const invite = await findValidInvite(conn, token);
      if (!invite) throw new FilialError('Convite inválido, expirado ou já utilizado.', 404);
      return { igreja: invite.igreja, matriz: invite.matriz };
    } finally { await conn.end(); }
  }

  // Cria a conta do pastor da filial e consome o convite, tudo ou nada.
  async function acceptInvite(token, { cod_membro, nome, email, senha, birth } = {}) {
    if (!text(cod_membro, 16) || !text(nome, 150) || !text(email, 150) || !isDate(birth)) throw new FilialError('Preencha código, nome, email e data de nascimento.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new FilialError('Email inválido.');
    if (typeof senha !== 'string' || senha.length < 10 || senha.length > 128) throw new FilialError('A senha deve ter entre 10 e 128 caracteres.');
    const senhaHash = await hashPassword(senha);
    return transaction(async conn => {
      const invite = await findValidInvite(conn, token, true);
      if (!invite) throw new FilialError('Convite inválido, expirado ou já utilizado.', 404);
      const [pastors] = await conn.query('SELECT id_user FROM user WHERE id_igreja = ? AND cargo IN (?) FOR UPDATE', [invite.id_igreja, PASTOR_ROLES]);
      if (pastors.length) throw new FilialError('Esta filial já tem pastor.', 409);
      try {
        await conn.query('INSERT INTO user (cod_membro, nome, email, senha, birth, cargo, id_igreja) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cod_membro.trim(), nome.trim(), email.trim(), senhaHash, birth, 'Pastor', invite.id_igreja]);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') throw new FilialError('Este email já está cadastrado.', 409);
        throw error;
      }
      const [result] = await conn.query('UPDATE convites SET usado_em = UTC_TIMESTAMP() WHERE id_convite = ? AND usado_em IS NULL', [invite.id_convite]);
      if (result.affectedRows !== 1) throw new FilialError('Convite inválido, expirado ou já utilizado.', 404);
      return { igreja: invite.igreja };
    });
  }

  return { createFilial, listFiliais, createInvite, getInvite, acceptInvite };
}

export default createFilialService(banco);
