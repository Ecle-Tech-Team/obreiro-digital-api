import banco from '../repository/connection.js';

async function createAviso(titulo, conteudo, id_igreja) {
    const sql = "INSERT INTO avisos (titulo, conteudo, id_igreja) VALUES (?, ?, ?)";
    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, [titulo, conteudo, id_igreja]);
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

async function deleteAviso(id_aviso) {
    const sql = "DELETE FROM avisos WHERE id_aviso = ?";
    const conn = await banco.connect();
    try {
        await conn.query(sql, [id_aviso]);
    } finally {
        conn.end();
    };
};

export default { createAviso, selectAvisos, editAviso, deleteAviso };