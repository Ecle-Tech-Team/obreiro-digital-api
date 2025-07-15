import banco from '../repository/connection.js';

async function createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja) {
    const sql = "INSERT INTO eventos (nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja];

    const conn = await banco.connect();
    await conn.query(sql, values);
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

async function selectEventos(id_igreja) {
    const sql = "SELECT * FROM eventos WHERE id_igreja = ?";

    const conn = await banco.connect();
    const [rows] = await conn.query(sql, [id_igreja]);
    conn.end();

    return rows;
}

async function selectEventosSemana(id_igreja, semanaInicio, semanaFim) {
  const sql = `
    SELECT * FROM eventos 
    WHERE id_igreja = ? 
      AND data_inicio BETWEEN ? AND ?
    ORDER BY data_inicio ASC
  `;
  const conn = await banco.connect();
  const [rows] = await conn.query(sql, [id_igreja, semanaInicio, semanaFim]);
  conn.end();
  return rows;
}

async function updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local) {
    const sql = "UPDATE eventos SET nome = ?, data_inicio = ?, horario_inicio = ?, data_fim = ?, horario_fim = ?, local = ? WHERE id_evento = ?";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_evento];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function countEventos(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM eventos WHERE id_igreja = ?";

    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function deleteEvento(id_evento) {
    const sql = "DELETE FROM eventos WHERE id_evento = ?";
    const conn = await banco.connect();
    try {
        await conn.query(sql, [id_evento]);
    } finally {
        conn.end();
    };
};

export default { createEvento, getIgrejas, selectEventosSemana, selectEventos, updateEvento, countEventos, deleteEvento };