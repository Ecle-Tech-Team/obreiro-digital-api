import banco from '../repository/connection.js';

async function login(email, senha){

    const sql = `SELECT  
        u.id_user, u.email, u.nome, u.cargo, u.id_igreja, i.id_matriz
        FROM user u
        JOIN igreja i ON u.id_igreja = i.id_igreja
        WHERE u.email = ? AND u.senha = ?`;

    const dataLogin = [email, senha];

    const conn = await banco.connect();
    const [row] = await conn.query(sql, dataLogin);
    conn.end();

    return row[0];
}

export default {login};