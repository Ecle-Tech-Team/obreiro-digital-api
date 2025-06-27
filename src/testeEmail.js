import sendEmail from './services/emailServices.js';

sendEmail('lucasdeangelo343@gmail.com', 'Teste', 
    `
        <div style="font-family: Arial, sans-serif; padding: 20px;">            
            <h2 style="color: #15616D;">Confirmação de Alteração de Email</h2>
            <p>Olá,</p>
            <p>Informamos que o email da sua conta foi alterado com sucesso.</p>
            <p>Se você não reconhece essa alteração, entre em contato com o suporte imediatamente.</p>
            <br/>
            <p style="font-size: 12px; color: #888;">Este é um email automático, por favor, não responda.</p>
        </div>
    `);