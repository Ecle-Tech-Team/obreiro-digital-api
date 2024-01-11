import banco from '../repository/connection.js';

async function createVisitante(nome, cristao, data_visita, congregacao, ministerio, convidado_por) {
  console.log('Valor de id_membro recebido:', convidado_por);

  const sql = "INSERT INTO visitante(nome, cristao, data_visita, congregacao, ministerio, id_membro) VALUES(?, ?, ?, ?, ?, ?)";
  
  const values = [nome, cristao, data_visita, congregacao, ministerio, convidado_por];

  const conn = await banco.connect();
  await conn.query(sql, values);
  conn.end();      
};

async function selectMembros() {
  const sql = "SELECT * FROM membro"

  const conn = await banco.connect();
  const [rows] = await conn.query(sql);
  conn.end();

  return rows;
};

async function selectVisitantes(){
  const sql = "SELECT v.*, m.nome AS nome_membro FROM visitante v LEFT JOIN membro m ON v.id_membro = m.id_membro"

  const conn = await banco.connect();
  
  try {
    const [rows] = await conn.query(sql);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    conn.end();
  }
};

async function countVisitantes() {
  const sql = "SELECT COUNT(*) as total FROM visitante";

  const conn = await banco.connect();
  
  try {
    const [rows] = await conn.query(sql);
    return rows[0];
  } catch (error) {
      throw error;
  } finally {
      conn.end();
  }
};

export default { createVisitante, selectMembros, selectVisitantes, countVisitantes }