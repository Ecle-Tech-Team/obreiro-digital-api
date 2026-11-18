import banco from '../repository/connection.js';

async function checkEmail(email) {

  const sql = "SELECT id_user, email, senha FROM user WHERE email = ?";

  const conn = await banco.connect();
  try { const [rows] = await conn.query(sql, [email]); return rows; }
  finally { await conn.end(); }
}


export default { checkEmail }
