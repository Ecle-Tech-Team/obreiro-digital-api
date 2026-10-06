import mysql2 from 'mysql2/promise';
import 'dotenv/config';

async function connect() {
    for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
        if (!process.env[key]) throw new Error(`Configuração de banco ausente: ${key}`);
    }
    const connection = await mysql2.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    return connection;
}

export default {connect};
