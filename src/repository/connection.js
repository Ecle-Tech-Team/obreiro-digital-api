import mysql2 from 'mysql2/promise';

async function connect() {
    const connection = await mysql2.createConnection({
        host: 'monorail.proxy.rlwy.net',
        port: 32439,
        user: 'root',
        password: 'CEecHPLpeYPRfKKTQXgQBJpYtbCyfwjS',
        database: 'railway',
    });

    return connection;
}

export default {connect};