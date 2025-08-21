import banco from '../repository/connection.js';

async function createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz) {
    const sql = "INSERT INTO igreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const values = [nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz || null];
    
    const conn = await banco.connect();
    conn.query(sql, values);    
    conn.end();    
}

async function updateIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja) {
    const sql = "UPDATE igreja SET nome = ?, cnpj = ?, data_fundacao = ?, setor = ?, ministerio = ?, cep = ?, endereco = ?, bairro = ?, cidade = ? WHERE id_igreja = ?";
    
    const values = [nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja];
    
    const conn = await banco.connect();
    conn.query(sql, values);    
    conn.end();    
}

async function listarIgrejasSubordinadas(id_matriz) {
  const sql = "SELECT * FROM igreja WHERE id_matriz = ?";
  const conn = await banco.connect();
  const [rows] = await conn.query(sql, [id_matriz]);
  conn.end();
  return rows;
}

async function vincularIgrejaAMatriz(id_igreja, id_matriz) {
  const sql = "UPDATE igreja SET id_matriz = ? WHERE id_igreja = ?";
  const conn = await banco.connect();
  await conn.query(sql, [id_matriz, id_igreja]);
  conn.end();
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