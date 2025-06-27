import banco from '../repository/connection.js';

async function createUser(cod_membro, nome, email, senha, birth, cargo, id_igreja) {

    const sql = "INSERT INTO user(cod_membro, nome, email, senha, birth, cargo, id_igreja) VALUES(?, ?, ?, ?, ?, ?, ?)";
    
    const values = [cod_membro, nome, email, senha, birth, cargo, id_igreja];

    const conn = await banco.connect();
    conn.query(sql, values); 
    conn.end();      
}

async function updateUserPartial(id_user, userData) {
    const allowedFields = ['cod_membro', 'nome', 'email', 'senha', 'birth', 'cargo', 'id_igreja'];
    
    const fieldsToUpdate = [];
    const values = [];

    for (const field of allowedFields) {
        if (userData.hasOwnProperty(field)) {
            fieldsToUpdate.push(`${field} = ?`);
            values.push(userData[field]);
        }
    }

    if (fieldsToUpdate.length === 0) {
        throw new Error("Nenhum campo válido fornecido para atualização.");
    }

    const sql = `UPDATE user SET ${fieldsToUpdate.join(', ')} WHERE id_user = ?`;

    values.push(id_user);

    const conn = await banco.connect();
    try {
        await conn.query(sql, values);
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

async function selectUserIdIgreja(id_igreja) {
    let sql = 'SELECT * FROM user WHERE id_igreja = ?';
  
    const conn = await banco.connect();
    const [row] = await conn.query(sql, id_igreja);
    conn.end();

    return row;
}

async function selectUser() {
    let sql = 'SELECT * FROM user';
  
    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql);
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

async function getUserById(id_user) {
    const sql = 'SELECT id_user, nome, email, cargo, id_igreja FROM user WHERE id_user = ?';
    
    const conn = await banco.connect();
    try {
        const [rows] = await conn.query(sql, [id_user]);
        return rows[0]; // Retorna apenas o usuário encontrado
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        throw error;
    } finally {
        conn.end();
    }
}


export default {createUser, selectUserIdIgreja, selectUser, updateUserPartial, selectUserOnly, getIgrejas, getUserById};