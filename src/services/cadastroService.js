import banco from '../repository/connection.js';

async function createUser(cod_membro, nome, email, senha, birth, cargo) {

    const sql = "INSERT INTO user(cod_membro, nome, email, senha, birth, cargo) VALUES(?, ?, ?, ?, ?, ?)";
    
    const values = [cod_membro, nome, email, senha, birth, cargo];

    const conn = await banco.connect();
    conn.query(sql, values);
    conn.end();      
}

async function updateUser(id_user, cod_membro, nome, email, senha, birth, cargo) {
    const sql = "UPDATE user SET cod_membro = ?, nome = ?, email = ?, senha = ?, birth = ?, cargo = ? WHERE id_user = ?";
    
    const values = [cod_membro, nome, email, senha, birth, cargo, id_user];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
}

async function selectUser() {
    const sql = 'SELECT * FROM user'
    
    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function selectUserOnly(id_user) {
    const sql = 'SELECT * FROM user WHERE id_user = ?';
    
    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql, [id_user]);
        return rows[0];
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

export default {createUser, selectUser, updateUser, selectUserOnly};