import banco from '../repository/connection.js';

async function createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz) {
    const sql = "INSERT INTO eventos (nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz];

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

async function selectEventosSemana(id_igreja, id_matriz, semanaInicio, semanaFim) {
  const sql = `
    SELECT * FROM eventos 
    WHERE (id_igreja = ? OR id_igreja = ?) 
      AND data_inicio BETWEEN ? AND ?
    ORDER BY data_inicio ASC
  `;
  const conn = await banco.connect();
  const [rows] = await conn.query(sql, [id_igreja, id_matriz, semanaInicio, semanaFim]);
  conn.end();
  return rows;
}

async function selectEventosComMatriz(id_igreja) {
  const conn = await banco.connect();
  try {
    // Descobre a matriz "real" da igreja (se for matriz, usa ela mesma)
    const [[igrejaRow]] = await conn.query(
      'SELECT id_matriz FROM igreja WHERE id_igreja = ?',
      [id_igreja]
    );
    const idMatrizReal = igrejaRow?.id_matriz || id_igreja;

    // Agora busca: locais da igreja OU globais da matriz
    const [rows] = await conn.query(
      `
      SELECT 
        e.*,
        CASE WHEN e.is_global = 1 THEN 'matriz' ELSE 'local' END AS tipo_evento
      FROM eventos e
      WHERE e.id_igreja = ? 
         OR (e.is_global = 1 AND e.id_matriz = ?)
      ORDER BY e.data_inicio ASC, e.horario_inicio ASC
      `,
      // IMPORTANTE: passar os DOIS parâmetros
      [id_igreja, idMatrizReal]
    );

    return rows;
  } finally {
    conn.end();
  }
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

export default { createEvento, getIgrejas, selectEventosSemana, selectEventos, updateEvento, countEventos, selectEventosComMatriz, deleteEvento };