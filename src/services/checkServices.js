import banco from '../repository/connection.js';

async function checkEmail(email) {

  const sql = "SELECT id_user, email, senha FROM user WHERE email = ?";

  const conn = await banco.connect();
  try { const [rows] = await conn.query(sql, [email]); return rows; }
  finally { await conn.end(); }
}


async function getUserForReset(id_user) {
  const conn = await banco.connect();
  try {
    const [[row]] = await conn.query('SELECT id_user, email, senha FROM user WHERE id_user = ?', [id_user]);
    return row;
  } finally { await conn.end(); }
}

async function resetPasswordOnce(id_user, oldHash, newHash) {
  const conn = await banco.connect();
  try {
    const [result] = await conn.query('UPDATE user SET senha = ? WHERE id_user = ? AND senha = ?', [newHash, id_user, oldHash]);
    return result.affectedRows === 1;
  } finally { await conn.end(); }
}

export default { checkEmail, getUserForReset, resetPasswordOnce }
