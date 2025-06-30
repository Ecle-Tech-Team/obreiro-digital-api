import banco from '../repository/connection.js';
import emailServices from '../services/emailServices.js';

async function createReport(id_user, motivo, descricao, nome_user, email_user) {
    const sql = `
        INSERT INTO bug_reports (id_user, motivo, descricao, data_criacao)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        id_user,        
        motivo,
        descricao,
        new Date()
    ];

    const conn = await banco.connect();


    try {
        await conn.query(sql, values);

        await emailServices.sendReportEmail(nome_user, email_user, motivo, descricao, new Date(), id_user);
    } catch (error) {
        throw error;
    } finally {
        conn.end();
    }
}

export default { createReport };
