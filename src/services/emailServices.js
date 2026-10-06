import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_CONTATO,
        pass: process.env.SENHA_CONTATO
    }
});

async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: process.env.EMAIL_CONTATO,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
}

async function sendReportEmail(nome_user, email_user, motivo, descricao, dataCriacao, id_user) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_CONTATO, 
            pass: process.env.SENHA_CONTATO  
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_CONTATO,
        replyTo: email_user,
        to: process.env.EMAIL_CONTATO,
        subject: `Relato de Bug - ${motivo}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #15616D;">Relatório de Bug</h2>
                <p><strong>Data/Hora:</strong> ${new Date(dataCriacao).toLocaleString('pt-BR')}</p>
                <p><strong>ID do Usuário:</strong> ${escapeHtml(id_user)}</p>
                <p><strong>Nome do Usuário:</strong> ${escapeHtml(nome_user)}</p>
                <p><strong>Email do Usuário:</strong> ${escapeHtml(email_user)}</p>
                <p><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
                <p><strong>Descrição:</strong></p>
                <p>${escapeHtml(descricao)}</p>
                <br/>
                <p style="font-size: 12px; color: #888;">Este é um email automático, por favor, não responda.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}


export default { sendEmail, sendReportEmail };
