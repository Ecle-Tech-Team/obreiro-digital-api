import banco from '../repository/connection.js';
import { createHash } from 'node:crypto';
import { hashPassword, verifyPassword } from '../helpers/password.js';

async function login(email, senha){

    const sql = `SELECT  
        u.id_user, u.email, u.nome, u.cargo, u.id_igreja, i.id_matriz, u.senha, u.session_version
        FROM user u
        JOIN igreja i ON u.id_igreja = i.id_igreja
        WHERE u.email = ?`;

    const dataLogin = [email];

    const conn = await banco.connect();
    let row;
    try { [row] = await conn.query(sql, dataLogin); }
    finally { await conn.end(); }
    const user = row[0];
    if (!user || !await verifyPassword(senha, user.senha)) return undefined;
    if (!user.senha.startsWith('$scrypt$')) {
        const upgraded = await hashPassword(senha, { allowShort: true });
        const updateConn = await banco.connect();
        try { await updateConn.query('UPDATE user SET senha = ? WHERE id_user = ? AND senha = ?', [upgraded, user.id_user, user.senha]); }
        finally { await updateConn.end(); }
        user.senha = upgraded;
    }
    user.auth_tag = createHash('sha256').update(user.senha).digest('hex');
    delete user.senha;
    return user;
}

async function revokeSessions(id_user, version) {
    const conn = await banco.connect();
    try {
        const [result] = await conn.query('UPDATE user SET session_version = session_version + 1 WHERE id_user = ? AND session_version = ?', [id_user, version]);
        return result.affectedRows === 1;
    } finally { await conn.end(); }
}

export default {login, revokeSessions};
