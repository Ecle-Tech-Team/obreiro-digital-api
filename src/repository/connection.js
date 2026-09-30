import mysql2 from 'mysql2/promise';
import 'dotenv/config';

async function connect() {
    const connection = await mysql2.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'obreiro',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'obreiro_digital',
    });

    return connection;
}

export default {connect};
