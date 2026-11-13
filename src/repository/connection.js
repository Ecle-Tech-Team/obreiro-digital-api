import mysql2 from 'mysql2/promise';
import 'dotenv/config';

let pool;

function getPool() {
    if (pool) return pool;
    for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
        if (!process.env[key]) throw new Error(`Configuração de banco ausente: ${key}`);
    }
    pool = mysql2.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
        waitForConnections: true,
        queueLimit: 100,
        // Colunas DATE saem como 'AAAA-MM-DD' (sem hora nem fuso), para o dia nunca mudar no caminho.
        dateStrings: ['DATE'],
    });
    return pool;
}

// Devolve uma conexão do pool. O código existente chama conn.end() ao terminar;
// aqui isso devolve a conexão ao pool em vez de fechá-la.
async function connect() {
    const conn = await getPool().getConnection();
    conn.end = async () => conn.release();
    return conn;
}

async function close() {
    if (!pool) return;
    const current = pool;
    pool = undefined;
    await current.end();
}

export default { connect, close };
