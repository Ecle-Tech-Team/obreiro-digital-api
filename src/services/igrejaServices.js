import banco from '../repository/connection.js';

async function createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade) {
    const sql = "INSERT INTO igreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    const values = [nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade];
    
    const conn = await banco.connect();
    conn.query(sql, values);    
    conn.end();    
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

export default { createIgreja, getIgrejas };