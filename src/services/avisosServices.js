import banco from '../repository/connection.js';

async function createAviso(titulo, conteudo, id_igreja, is_global, id_matriz) {
    const sql = "INSERT INTO avisos (titulo, conteudo, id_igreja, is_global, id_matriz) VALUES (?, ?, ?, ?, ?)";
    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, [titulo, conteudo, id_igreja, is_global, id_matriz]);
        return result.insertId;
    } finally {
        conn.end();
    };
};

async function selectAvisos(id_igreja) {
    const sql = "SELECT * FROM avisos WHERE id_igreja = ? ORDER BY data_criacao DESC";
    const conn = await banco.connect();
    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows;
    } finally {
        conn.end();
    };
};

async function editAviso(id_aviso, titulo, conteudo) {
    const sql = "UPDATE avisos SET titulo = ?, conteudo = ? WHERE id_aviso = ?";
    const conn = await banco.connect();
    try {
        await conn.query(sql, [titulo, conteudo, id_aviso]);
    } finally {
        conn.end();
    };
};

async function selectAvisosComMatriz(id_igreja) {
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
        CASE WHEN e.is_global = 1 THEN 'matriz' ELSE 'local' END AS tipo_aviso
      FROM avisos e
      WHERE e.id_igreja = ? 
         OR (e.is_global = 1 AND e.id_matriz = ?)      
      `,
      // IMPORTANTE: passar os DOIS parâmetros
      [id_igreja, idMatrizReal]
    );

    return rows;
  } finally {
    conn.end();
  }
}

async function deleteAviso(id_aviso) {
    const sql = "DELETE FROM avisos WHERE id_aviso = ?";
    const conn = await banco.connect();
    try {
        await conn.query(sql, [id_aviso]);
    } finally {
        conn.end();
    };
};

export default { createAviso, selectAvisos, editAviso, selectAvisosComMatriz, deleteAviso };