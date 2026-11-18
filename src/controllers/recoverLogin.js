import express from 'express';
import db from '../services/checkServices.js';
import resets from '../services/passwordResetServices.js';
import email from '../services/emailServices.js';
import { hashPassword } from '../helpers/password.js';
import { RESET_CODE_TTL_MINUTES, generateResetCode, isResetCode } from '../helpers/resetCode.js';

const routes = express.Router();
const ACCEPTED = { message: 'Se a conta existir, as instruções serão enviadas.' };
const INVALID = { message: 'Código inválido ou expirado.' };

routes.post('/', async (request, response) => {
  const address = request.body?.email;
  if (typeof address !== 'string' || !address.trim() || address.length > 254) return response.status(400).json({ message: 'Email inválido.' });
  try {
    const [user] = await db.checkEmail(address.trim());
    if (user) {
      const code = generateResetCode();
      await resets.saveResetCode(user.id_user, code);
      // Envia sem segurar a resposta: o tempo de resposta não revela se a conta existe.
      email.sendEmail(user.email, 'Código para redefinir sua senha',
        `<p>Use este código para redefinir sua senha no Obreiro Digital:</p>
         <p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p>
         <p>Ele vale por ${RESET_CODE_TTL_MINUTES} minutos e pode ser usado uma vez. Se você não pediu, ignore este email.</p>`)
        .catch(error => console.error('Falha ao enviar o código de recuperação:', error?.code || error?.message));
    }
  } catch (error) {
    console.error('Erro na recuperação:', error);
  }
  return response.status(202).json(ACCEPTED);
});

routes.post('/confirm', async (request, response) => {
  const { email: address, code, newPassword } = request.body || {};
  if (typeof address !== 'string' || !address.trim() || address.length > 254 || !isResetCode(code)) return response.status(400).json(INVALID);
  if (typeof newPassword !== 'string' || newPassword.length < 10 || newPassword.length > 1024) {
    return response.status(400).json({ message: 'A nova senha deve ter entre 10 e 1024 caracteres.' });
  }
  try {
    const ok = await resets.resetWithCode(address.trim(), code, () => hashPassword(newPassword));
    return ok ? response.status(200).json({ message: 'Senha alterada.' }) : response.status(400).json(INVALID);
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return response.status(500).json({ message: 'Não foi possível redefinir a senha agora.' });
  }
});

export default routes;
