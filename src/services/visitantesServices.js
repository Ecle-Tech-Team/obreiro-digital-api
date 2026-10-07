import banco from '../repository/connection.js';

async function createVisitante(nome, cristao, data_visita, congregacao, ministerio, convidado_por, id_igreja) {
  const sql = "INSERT INTO visitante(nome, cristao, data_visita, congregacao, ministerio, id_membro, id_igreja) VALUES(?, ?, ?, ?, ?, ?, ?)";

  const values = [nome, cristao, data_visita, congregacao, ministerio, convidado_por, id_igreja];

  const conn = await banco.connect();
  try {
  await conn.query(sql, values);


  } finally { await conn.end(); }
};

async function getIgrejas() {
  const sql = "SELECT * FROM igreja";

  const conn = await banco.connect();

  try {
      const [rows] = await conn.query(sql);
      return rows;
  } catch (error) {
      throw error;
  } finally {
      await conn.end();
  }
}

async function selectMembros(id_igreja) {
  const sql = "SELECT * FROM membro WHERE id_igreja = ?"

  const conn = await banco.connect();
  try {
  const [rows] = await conn.query(sql, [id_igreja]);


  return rows;

  } finally { await conn.end(); }
};

async function selectVisitantes(id_igreja){
  const sql = "SELECT * FROM visitante WHERE id_igreja = ?"

  const conn = await banco.connect();

  try {
    const [rows] = await conn.query(sql, [id_igreja]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    await conn.end();
  }
};

async function countVisitantes(id_igreja) {
  const sql = "SELECT COUNT(*) as total FROM visitante WHERE id_igreja = ?";

  const conn = await banco.connect();

  try {
    const [rows] = await conn.query(sql, [id_igreja]);
    return rows[0].total;
  } catch (error) {
      throw error;
  } finally {
      await conn.end();
  }
};

export default { createVisitante, getIgrejas, selectMembros, selectVisitantes, countVisitantes }
