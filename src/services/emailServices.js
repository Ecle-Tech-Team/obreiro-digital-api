import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

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
        console.log(`Email enviado para ${to}`);
    } catch (error) {
        console.error('Erro ao enviar email:', error);
    }
}

export default sendEmail;
