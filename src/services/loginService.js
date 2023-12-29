import banco from '../repository/connection.js';

async function login(email, senha){

    const sql = "SELECT id_user, email, nome, cargo FROM user WHERE email = ? AND senha = ?";

    const dataLogin = [email, senha];

    const conn = await banco.connect();
    const [row] = await conn.query(sql, dataLogin);
    conn.end();

    return row;
}

export default {login};