import banco from '../repository/connection.js';

async function createDepartamentos(nome, birth, data_congresso, id_igreja) {
    const sql = "INSERT INTO departamentos(nome, birth, data_congresso, id_igreja) VALUES(?, ?, ?, ?)";
    
    const values = [nome, birth, data_congresso, id_igreja];

    const conn = await banco.connect();
    conn.query(sql, values);
    conn.end();
}  

async function updateDepartamento(id_departamento, nome, birth, data_congresso, id_igreja) {
    const sql = "UPDATE departamentos SET nome = ?, birth = ?, data_congresso = ?, id_igreja = ? WHERE id_departamento = ?";
    
    const values = [nome, birth, data_congresso, id_igreja, id_departamento];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
}

async function selectDepartamento(id_igreja) {
    const sql = "SELECT * FROM departamentos WHERE id_igreja = ?";

    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
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

async function selectDepartamentoOnly(id_departamento) {
    const sql = 'SELECT d.id_departamento, d.nome AS nome_departamento, d.birth, d.data_congresso, d.id_membro, m.id_membro AS id_membro_associado, m.nome AS nome_membro_associado FROM departamentos AS d LEFT JOIN membro AS m ON d.id_membro = m.id_membro WHERE d.id_departamento = ?';

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_departamento]);

        if (rows.length > 0) {
            return rows[0];
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function selectDepartamentosPorMatriz(id_matriz) {
  const sql = `
   SELECT * FROM departamentos 
    WHERE id_igreja = ? 
    OR id_igreja IN (
      SELECT id_igreja FROM igreja WHERE id_matriz = ?
    )
  `;

  const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_matriz, id_matriz]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
}

export default {createDepartamentos, updateDepartamento, selectDepartamento, getIgrejas, selectDepartamentoOnly, selectDepartamentosPorMatriz};