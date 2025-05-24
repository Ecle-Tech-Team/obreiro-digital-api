import banco from '../repository/connection.js';

async function createMembro(cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja) {

    const sql = "INSERT INTO membro(cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja) VALUES(?, ?, ?, ?, ?, ?, ?)";    

    const values = [cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja]; 

    const conn = await banco.connect();
    conn.query(sql, values);
    conn.end();      
}

async function selectDepartamentos() {
    const sql = "SELECT * FROM departamentos"

    const conn = await banco.connect();
    const [rows] = await conn.query(sql);
    conn.end();

    return rows;
}

async function countMembros(id_igreja) {
    const sql = "SELECT COUNT(*) as total FROM membro WHERE id_igreja = ?";

    const conn = await banco.connect();
    
    try {
        const [rows] = await conn.query(sql, [id_igreja]);
        return rows[0].total;
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function updateMembro(id_membro, cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja) {
    const sql = "UPDATE membro SET cod_membro = ?, nome = ?, numero = ?, birth = ?, novo_convertido = ?, id_departamento = ?, id_igreja = ? WHERE id_membro = ?";    
    const values = [cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja, id_membro];

    const conn = await banco.connect();
    await conn.query(sql, values);
    conn.end();      
}

async function selectMembro(id_igreja){
    const sql = "SELECT * FROM membro WHERE id_igreja = ?";

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

async function selectMembroOnly(id_membro) {
    const sql = "SELECT m.id_membro, m.cod_membro, m.nome, m.numero, m.birth, m.novo_convertido, m.id_departamento, d.nome AS nome_departamento FROM membro AS m JOIN departamentos AS d ON m.id_departamento = d.id_departamento WHERE m.id_membro = ?";

    const conn = await banco.connect();

    try {
        const [rows] = await conn.query(sql, [id_membro]);

        if (rows.length > 0) {
            return rows[0];
        } else {
            return false;
        }
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

async function deleteMembro(id_membro) {
    const sql = "DELETE FROM membro WHERE id_membro = ?";
    const conn = await banco.connect();
    try {
        await conn.query(sql, [id_membro]);
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

export default {createMembro, countMembros, updateMembro, selectMembro, selectMembroOnly, getIgrejas, selectDepartamentos, deleteMembro};