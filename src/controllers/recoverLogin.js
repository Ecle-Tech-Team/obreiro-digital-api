import express from 'express';
import db from '../services/checkServices.js';
import { generatePassword } from '../helpers/generatePassword.js';
import nodemailer from 'nodemailer';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { email } = request.body;

        const consult = await db.checkEmail(email);

        if (consult.length > 0) {
            const newPassword = await generatePassword();

            await db.changePassword(email, newPassword);

            const transporter = nodemailer.createTransport({
                service: "gmail",              
                auth: {
                    user: "ecletecnologia@gmail.com",
                    pass: "rjlr sijm ykso cidn",
                },
                tls: {
                    rejectUnauthorized: false,
                }
            });

            await transporter.sendMail({
                from: "Obreiro Digital <ecletecnologia@gmail.com>",
                to: email,
                subject: "Recuperação de Senha",
                html: `<h1>Solicitação realizada com sucesso!</h1>
                <p> Prezado Usuário,</p>
                <p>Recebemos uma solicitação de recuperação de senha para a sua conta no Obreiro Digital. Como parte do nosso processo de segurança, geramos uma nova senha temporária para você acessar a sua conta.</p>
                <p>Abaixo, você encontrará as informações necessárias para redefinir a sua senha:</p>
                <p><strong>Código de Recuperação de Senha: ${newPassword}</strong></p>
                <p>Para redefinir a sua senha, siga estas etapas simples:</p>
                <ol>
                    <li>Insira o seu nome de usuário ou endereço de e-mail associado à sua conta.</li>
                    <li>Digite o código de recuperação de senha fornecido acima.</li>
                    <li>Siga as instruções na tela para criar uma nova senha segura.</li>
                </ol>
                <p>Lembramos que este código de recuperação de senha é válido por 2 horas a partir do recebimento deste e-mail. Recomendamos que você redefina a sua senha imediatamente.</p>
                <p>Se você não solicitou esta recuperação de senha ou acredita que isso seja um erro, entre em contato conosco imediatamente para que possamos investigar.</p>
                <p>Atenciosamente,</p>
                <p>Obreiro Digital</p> `
            });

            response.status(200).send("E-mail enviado com sucesso.");
        } else {
            response.status(404).send("E-mail inválido");
        }
    } catch (erro) {
        response.status(500).send(`Erro na requisição ${erro}`);
    }
});

export default routes;