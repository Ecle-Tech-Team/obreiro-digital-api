import banco from '../repository/connection.js';

export function createChurchFactory(database) { return async function createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz) {
    const sql = "INSERT INTO igreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const values = [nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz || null];
    
    const conn = await database.connect();
    try {
        await conn.beginTransaction();
        const [result] = await conn.query(sql, values);
        const [existing] = await conn.query('SELECT id_saldo FROM saldo WHERE id_igreja = ? FOR UPDATE', [result.insertId]);
        if (existing.length > 1) throw new Error('Saldo duplicado para a igreja.');
        if (existing.length === 0) await conn.query('INSERT INTO saldo (saldo_atual, data_atualizacao, id_igreja) VALUES (?, CURDATE(), ?)', ['0.00', result.insertId]);
        await conn.commit();
        return result.insertId;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        await conn.end();
    }
}; }

const createIgreja = createChurchFactory(banco);

async function updateIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja) {
    const sql = "UPDATE igreja SET nome = ?, cnpj = ?, data_fundacao = ?, setor = ?, ministerio = ?, cep = ?, endereco = ?, bairro = ?, cidade = ? WHERE id_igreja = ?";
    
    const values = [nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja];
    
    const conn = await banco.connect();
    try { await conn.query(sql, values); }
    finally { await conn.end(); }
}

async function listarIgrejasSubordinadas(id_matriz) {
  const sql = "SELECT * FROM igreja WHERE id_matriz = ?";
  const conn = await banco.connect();
  try { const [rows] = await conn.query(sql, [id_matriz]); return rows; }
  finally { await conn.end(); }
}

async function vincularIgrejaAMatriz(id_igreja, id_matriz) {
  const sql = "UPDATE igreja SET id_matriz = ? WHERE id_igreja = ?";
  const conn = await banco.connect();
  try { await conn.query(sql, [id_matriz, id_igreja]); }
  finally { await conn.end(); }
}

async function getIgrejas() {
    const sql = "SELECT * FROM igreja";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function getIgrejaById(id_igreja) {
  const sql = "SELECT * FROM igreja WHERE id_igreja = ?";
  
  const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_igreja]);
    return rows[0];
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

async function countIgrejasSubordinadas(id_matriz) {
  const sql = "SELECT COUNT(*) as total FROM igreja WHERE id_matriz = ?";
  const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_matriz]);
    return rows[0].total;
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

export default { createIgreja, updateIgreja, listarIgrejasSubordinadas, vincularIgrejaAMatriz, getIgrejas, getIgrejaById, countIgrejasSubordinadas };
