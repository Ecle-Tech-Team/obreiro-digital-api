import express from 'express';
import db from '../services/checkServices.js';
import email from '../services/emailServices.js';
import { hashPassword } from '../helpers/password.js';
import { issueResetToken, resetIdentity, verifyResetToken } from '../helpers/resetToken.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
  try {
    const address = request.body?.email;
    if (typeof address !== 'string' || address.length > 254) return response.status(400).json({ message: 'Email inválido.' });
    const [user] = await db.checkEmail(address);
    if (user) {
      const code = issueResetToken(user.id_user, user.senha);
      await email.sendEmail(user.email, 'Recuperação de senha', `<p>Use este código para redefinir sua senha em até 15 minutos:</p><p>${code}</p>`);
    }
    return response.status(202).json({ message: 'Se a conta existir, as instruções serão enviadas.' });
  } catch (error) {
    console.error('Erro na recuperação:', error);
    return response.status(202).json({ message: 'Se a conta existir, as instruções serão enviadas.' });
  }
});

routes.post('/confirm', async (request, response) => {
  try {
    const { token, newPassword } = request.body || {};
    const id_user = resetIdentity(token);
    const user = await db.getUserForReset(id_user);
    if (!user || !verifyResetToken(token, user.id_user, user.senha)) return response.status(400).json({ message: 'Código inválido ou expirado.' });
    const newHash = await hashPassword(newPassword);
    if (!await db.resetPasswordOnce(id_user, user.senha, newHash)) return response.status(400).json({ message: 'Código inválido ou expirado.' });
    return response.status(200).json({ message: 'Senha alterada.' });
  } catch { return response.status(400).json({ message: 'Código inválido ou expirado.' }); }
});

export default routes;
