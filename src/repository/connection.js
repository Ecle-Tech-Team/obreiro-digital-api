import mysql2 from 'mysql2/promise';

async function connect() {
    const connection = await mysql2.createConnection({
        host: 'monorail.proxy.rlwy.net',
        port: 46402,
        user: 'root',
        password: 'C2C-g5bA36-ACA6bEG--f55aeHc24CdB',
        database: 'railway',
    });

    return connection;
}

export default {connect};