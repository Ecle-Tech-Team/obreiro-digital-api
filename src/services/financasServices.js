import banco from '../repository/connection.js';

export class FinancialValidationError extends Error {}

function cents(value) {
  const text = String(value);
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(text)) throw new FinancialValidationError('Valor financeiro inválido.');
  const [integer, fractional = ''] = text.split('.');
  const result = BigInt(integer) * 100n + BigInt(fractional.padEnd(2, '0') || '0');
  if (result <= 0n) throw new FinancialValidationError('Valor financeiro inválido.');
  return result;
}

const money = value => `${value < 0n ? '-' : ''}${(value < 0n ? -value : value) / 100n}.${String((value < 0n ? -value : value) % 100n).padStart(2, '0')}`;
const signed = (tipo, value) => tipo === 'Entrada' ? value : tipo === 'Saída' ? -value : (() => { throw new FinancialValidationError('Tipo financeiro inválido.'); })();

export function createFinancialLedger(database) {
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

  async function lockedBalance(conn, id_igreja) {
    const [rows] = await conn.query('SELECT id_saldo, saldo_atual FROM saldo WHERE id_igreja = ? FOR UPDATE', [id_igreja]);
    if (rows.length !== 1) throw new Error('Saldo da igreja indisponível ou duplicado.');
    return rows[0];
  }

  async function writeBalance(conn, id_saldo, balance) {
    if (balance < -9999999999n || balance > 9999999999n) throw new Error('Saldo fora do limite.');
    const [result] = await conn.query('UPDATE saldo SET saldo_atual = ?, data_atualizacao = CURDATE() WHERE id_saldo = ?', [money(balance), id_saldo]);
    if (result.affectedRows !== 1) throw new Error('Saldo não atualizado.');
  }

  async function createFinancas(tipo, categoria, valor, descricao, data, id_igreja) {
    const amount = cents(valor);
    const change = signed(tipo, amount);
    return transaction(async conn => {
      const saldo = await lockedBalance(conn, id_igreja);
      const [result] = await conn.query('INSERT INTO financas (tipo, categoria, valor, descricao, data, id_igreja, id_saldo) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tipo, categoria, money(amount), descricao, data, id_igreja, saldo.id_saldo]);
      await writeBalance(conn, saldo.id_saldo, BigInt(String(saldo.saldo_atual).replace('.', '')) + change);
      return result.insertId;
    });
  }

  async function updateFinancas(id_financas, tipo, categoria, valor, descricao, data, id_igreja) {
    const amount = cents(valor);
    const replacement = signed(tipo, amount);
    return transaction(async conn => {
      const saldo = await lockedBalance(conn, id_igreja);
      const [[original]] = await conn.query('SELECT tipo, valor, id_saldo FROM financas WHERE id_financas = ? AND id_igreja = ? FOR UPDATE', [id_financas, id_igreja]);
      if (!original || Number(original.id_saldo) !== Number(saldo.id_saldo)) throw new Error('Lançamento não encontrado na igreja.');
      const before = signed(original.tipo, cents(original.valor));
      const [result] = await conn.query('UPDATE financas SET tipo = ?, categoria = ?, valor = ?, descricao = ?, data = ? WHERE id_financas = ? AND id_igreja = ?', [tipo, categoria, money(amount), descricao, data, id_financas, id_igreja]);
      if (result.affectedRows !== 1) throw new Error('Lançamento não atualizado.');
      await writeBalance(conn, saldo.id_saldo, BigInt(String(saldo.saldo_atual).replace('.', '')) + replacement - before);
    });
  }

  async function getFinancas(id_igreja) {
    const conn = await database.connect();
    try { const [rows] = await conn.query('SELECT * FROM financas WHERE id_igreja = ?', [id_igreja]); return rows; }
    finally { await conn.end(); }
  }

  async function getSaldo(id_igreja) {
    const conn = await database.connect();
    try {
      const [rows] = await conn.query('SELECT saldo_atual FROM saldo WHERE id_igreja = ?', [id_igreja]);
      if (rows.length !== 1) throw new Error('Saldo da igreja indisponível ou duplicado.');
      return rows[0].saldo_atual;
    } finally { await conn.end(); }
  }

  return { createFinancas, updateFinancas, getFinancas, getSaldo };
}

export default createFinancialLedger(banco);
