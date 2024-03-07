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

async function updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja) {
    const sql = "UPDATE eventos SET nome = ?, data_inicio = ?, horario_inicio = ?, data_fim = ?, horario_fim = ?, local = ?, id_igreja = ? WHERE id_evento = ?";

    const values = [nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, id_evento];

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

export default { createEvento, getIgrejas, selectEventos, updateEvento, countEventos };