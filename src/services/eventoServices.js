import banco from '../repository/connection.js';

async function createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local) {
    const sql = "INSERT INTO eventos (nome, data_inicio, horario_inicio, data_fim, horario_fim, local) VALUES (?, ?, ?, ?, ?, ?)";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();
}

async function selectEventos() {
    const sql = "SELECT * FROM eventos";

    const conn = await banco.connect();
    const [rows] = await conn.query(sql);
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

async function countEventos() {
    const sql = "SELECT COUNT(*) as total FROM eventos";

    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql);
        return rows[0];
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

export default { createEvento, selectEventos, updateEvento, countEventos };