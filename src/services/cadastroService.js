import banco from '../repository/connection.js';

async function createUser(cod_membro, nome, email, senha, birth, cargo, id_igreja) {

    const sql = "INSERT INTO user(cod_membro, nome, email, senha, birth, cargo, id_igreja) VALUES(?, ?, ?, ?, ?, ?, ?)";
    
    const values = [cod_membro, nome, email, senha, birth, cargo, id_igreja];

    const conn = await banco.connect();
    conn.query(sql, values); 
    conn.end();      
}

async function updateUser(id_user, cod_membro, nome, email, senha, birth, cargo, id_igreja) {
    const sql = "UPDATE user SET cod_membro = ?, nome = ?, email = ?, senha = ?, birth = ?, cargo = ?, id_igreja = ? WHERE id_user = ?";
    
    const values = [cod_membro, nome, email, senha, birth, cargo, id_igreja, id_user];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
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

async function getIgrejas() {
    const sql = "SELECT * FROM igreja";

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
async function selectUser(id_igreja) {
    let sql = 'SELECT * FROM user WHERE id_igreja = ?';
  
    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

export default {createUser, getIgrejas, selectUser, updateUser, selectUserOnly};