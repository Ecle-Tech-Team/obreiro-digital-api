import banco from '../repository/connection.js';

async function createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz) {
    const sql = "INSERT INTO eventos (nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz];

    const conn = await banco.connect();
  try {
    await conn.query(sql, values);


  } finally { await conn.end(); }
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
        await conn.end();
    }
}

async function selectEventos(id_igreja) {
    const sql = "SELECT * FROM eventos WHERE id_igreja = ?";

    const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_igreja]);


    return rows;

  } finally { await conn.end(); }
}

async function selectEventosSemana(id_igreja, id_matriz, semanaInicio, semanaFim) {
  const sql = `
    SELECT * FROM eventos
    WHERE (id_igreja = ? OR (id_igreja = ? AND is_global = 1))
      AND data_inicio BETWEEN ? AND ?
    ORDER BY data_inicio ASC
  `;
  const conn = await banco.connect();
  try {
  const [rows] = await conn.query(sql, [id_igreja, id_matriz, semanaInicio, semanaFim]);

  return rows;

  } finally { await conn.end(); }
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
    await conn.end();
  }
}

async function updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja) {
    const sql = "UPDATE eventos SET nome = ?, data_inicio = ?, horario_inicio = ?, data_fim = ?, horario_fim = ?, local = ? WHERE id_evento = ? AND id_igreja = ?";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_evento, id_igreja];

    const conn = await banco.connect();
    try { const [result] = await conn.query(sql, values); if (result.affectedRows !== 1) throw new Error('Evento não encontrado.'); }
    finally { await conn.end(); }
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
        await conn.end();
    }
}

async function deleteEvento(id_evento, id_igreja) {
    const sql = "DELETE FROM eventos WHERE id_evento = ? AND id_igreja = ?";
    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, [id_evento, id_igreja]);
        if (result.affectedRows !== 1) throw new Error('Evento não encontrado.');
    } finally {
        await conn.end();
    };
};

export default { createEvento, getIgrejas, selectEventosSemana, selectEventos, updateEvento, countEventos, selectEventosComMatriz, deleteEvento };
