import express from 'express';
import db from '../services/checkServices.js'; // Importando o módulo de serviço do banco de dados
import { generatePassword } from '../helpers/generatePassword.js'; // Importando a função para gerar senhas
import nodemailer from 'nodemailer'; // Importando o módulo para enviar e-mails

const routes = express.Router(); // Criando um roteador com Express

routes.post('/', async (request, response) => {
  try {

    const { email } = request.body; // Renomeando a variável para evitar conflito // Obtendo o e-mail do corpo da requisição

    const user = await db.checkEmail(email); // Verificando se o e-mail está no banco de dados

    if (user.length > 0) { // Se o e-mail existe no banco de dados
      const newPassword = generatePassword(); // Gerando uma nova senha
      await db.changePassword(email, newPassword); // Atualizando a senha no banco de dados

      const transporter = nodemailer.createTransport({
        // Configurações para enviar e-mail
        host: 'smtp.gmail.com',
        secure: true,
        port: 465,
        auth: {
          user: 'safeinventoryepi@gmail.com',
          pass: 'owiaemvbuvjnklkj',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        
        from: 'SafeInventory <testesafeinventory@gmail.com>',
        to: email,
        subject: 'Pedido de nova senha realizado.',
        html: `<h1>Senha alterada com sucesso</h1>
        <p>Prezado Usuário,</p>
        <p>Recebemos uma solicitação de recuperação de senha para a sua conta no Safe Inventory. Como parte do nosso processo de segurança, geramos uma nova senha temporária para você acessar a sua conta.</p>
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
        <p>Agradecemos por escolher o Safe Inventory e estamos à disposição para ajudar com qualquer dúvida ou problema que você possa ter.</p>
        <p>Atenciosamente,</p>
        <p>A Equipe de Suporte SafeInventory</p> `
      });

      console.log('E-mail enviado com sucesso.'); // Registrando no console que o e-mail foi enviado
      response.status(200).send('E-mail enviado com sucesso.'); // Em caso de erro, registrando no console
    } else {
      response.status(404).send({ message: 'Usuário não encontrado' }); // Se o e-mail não existe, responde com status 404
    }
  } catch (err) {
    console.log(err); // Em caso de erro, registrando no console
    response.status(500).send({ message: `Houve um erro no banco de dados. ${err}` }); // Respondendo com status 500
  }
});

export default routes; // Exportando o roteador para uso em outros arquivos
