import banco from '../repository/connection.js';
import { hashPassword } from '../helpers/password.js';

async function createUser(cod_membro, nome, email, senha, birth, cargo, id_igreja) {

    const sql = "INSERT INTO user(cod_membro, nome, email, senha, birth, cargo, id_igreja) VALUES(?, ?, ?, ?, ?, ?, ?)";

    const values = [cod_membro, nome, email, await hashPassword(senha), birth, cargo, id_igreja];

    const conn = await banco.connect();
    try {
        await conn.query(sql, values);
    } finally {
        await conn.end();
    }
}

async function createFirstUser(cod_membro, nome, email, senha, birth, id_igreja) {
    const conn = await banco.connect();
    try {
        await conn.beginTransaction();
        const [[church]] = await conn.query('SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja = ? FOR UPDATE', [id_igreja]);
        if (!church || church.id_matriz !== null) throw new Error('Igreja inicial inválida.');
        const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM user WHERE id_igreja = ?', [id_igreja]);
        if (total) throw new Error('Cadastro inicial já realizado.');
        await conn.query('INSERT INTO user(cod_membro, nome, email, senha, birth, cargo, id_igreja) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [cod_membro, nome, email, await hashPassword(senha), birth, 'Pastor Matriz', id_igreja]);
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally { await conn.end(); }
}

async function updateUserPartial(id_user, userData, id_igreja) {
    const allowedFields = ['cod_membro', 'nome', 'email', 'senha', 'birth', 'cargo', 'id_igreja'];

    const fieldsToUpdate = [];
    const values = [];

    for (const field of allowedFields) {
        if (userData.hasOwnProperty(field)) {
            fieldsToUpdate.push(`${field} = ?`);
            values.push(field === 'senha' ? await hashPassword(userData[field]) : userData[field]);
        }
    }

    if (fieldsToUpdate.length === 0) {
        throw new Error("Nenhum campo válido fornecido para atualização.");
    }

    const sql = `UPDATE user SET ${fieldsToUpdate.join(', ')} WHERE id_user = ? AND id_igreja = ?`;

    values.push(id_user, id_igreja);

    const conn = await banco.connect();
    try {
        const [result] = await conn.query(sql, values);
        if (result.affectedRows !== 1) throw new Error('Usuário não encontrado.');
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
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
        await conn.end();
    }
}

async function selectUserIdIgreja(id_igreja) {
    let sql = 'SELECT id_user, cod_membro, nome, email, birth, cargo, id_igreja FROM user WHERE id_igreja = ?';

    const conn = await banco.connect();
  try {
    const [row] = await conn.query(sql, id_igreja);


    return row;

  } finally { await conn.end(); }
}

async function selectUser(id_user) {
    let sql = 'SELECT id_user, cod_membro, nome, email, birth, cargo, id_igreja FROM user WHERE id_user = ?';

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_user]);
        return rows[0];
    } catch (error) {
        throw error;
    } finally {
        await conn.end();
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
        await conn.end();
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
        await conn.end();
    }
}

async function selectUsersPorMatriz(id_matriz) {
  const sql = `
   SELECT id_user, cod_membro, nome, email, birth, cargo, id_igreja FROM user
    WHERE id_igreja = ?
    OR id_igreja IN (
      SELECT id_igreja FROM igreja WHERE id_matriz = ?
    )
  `;

  const conn = await banco.connect();
  try {
    const [rows] = await conn.query(sql, [id_matriz, id_matriz]);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    await conn.end();
  }
}

async function deleteUser(id_user, id_igreja) {
    const conn = await banco.connect();
    try {
        await conn.beginTransaction();
        const [[target]] = await conn.query('SELECT id_user FROM user WHERE id_user = ? AND id_igreja = ? FOR UPDATE', [id_user, id_igreja]);
        if (!target) throw new Error('Usuário não encontrado.');
        await conn.query('UPDATE bug_reports SET id_user = NULL WHERE id_user = ?', [id_user]);
        const [result] = await conn.query('DELETE FROM user WHERE id_user = ? AND id_igreja = ?', [id_user, id_igreja]);
        if (result.affectedRows !== 1) throw new Error('Usuário não removido.');
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        await conn.end();
    }
}

export default {createUser, createFirstUser, selectUserIdIgreja, selectUser, updateUserPartial, selectUserOnly, getIgrejas, getUserById, selectUsersPorMatriz, deleteUser};
