import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.staging' });
const db = await mysql.createConnection({ host: '127.0.0.1', port: 3308, user: 'root', password: process.env.MYSQL_ROOT_PASSWORD });
try {
  if (process.argv[2] === 'apply') {
    await db.query("REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'obreiro_staging'@'%'");
    await db.query("GRANT SELECT, INSERT, UPDATE, DELETE ON obreiro_staging.* TO 'obreiro_staging'@'%'");
  }
  const [grants] = await db.query("SHOW GRANTS FOR 'obreiro_staging'@'%'");
  if (process.argv[2] === 'inspect') console.log(grants);
  const details = Object.values(grants[1] || grants[0] || {})[0] || '';
  if (!details.includes('SELECT, INSERT, UPDATE, DELETE') || details.includes('ALL PRIVILEGES')) throw new Error('Conta da aplicação não tem apenas DML.');
  console.log('Conta de staging: apenas SELECT, INSERT, UPDATE, DELETE no schema da aplicação.');
} finally { await db.end(); }
