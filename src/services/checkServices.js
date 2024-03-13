import banco from '../repository/connection.js';

async function checkEmail(email) {

  const sql = "SELECT email FROM user WHERE email = ?";

  const conn = await banco.connect();
  const [rows] = await conn.query(sql, email);
    conn.end();
  
  return rows;
}

async function checkCode(email, codigo) {
    const sql = "SELECT * FROM user WHERE email = ? and senha = ?";

    const conn = await banco.connect();
    const [rows] = await conn.query(sql, email, codigo);
    conn.end();

    return rows;
} 

async function changePassword(email, newPassword) {
    const sql = "UPDATE user SET senha = ? WHERE email = ?";

    const values = [email, newPassword];

  const conn = await banco.connect();
  await conn.query(sql, values);
    conn.end();

    return;
}

export default {checkEmail, changePassword, checkCode}