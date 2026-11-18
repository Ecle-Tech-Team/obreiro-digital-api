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
    } finally {
        await conn.end();
    }

    // O relato já foi salvo; uma falha no aviso por email não deve fazer o usuário reenviar.
    try {
        await emailServices.sendReportEmail(nome_user, email_user, motivo, descricao, new Date(), id_user);
    } catch (error) {
        console.error("Relato salvo, mas o aviso por email falhou:", error?.code || error?.message);
    }
}

export default { createReport };
