import banco from '../repository/connection.js';
import { RESET_CODE_TTL_MINUTES, RESET_MAX_ATTEMPTS, hashResetCode, resetCodeMatches } from '../helpers/resetCode.js';

// Guarda (ou troca) o código da conta. Erros da última hora continuam contando.
async function saveResetCode(id_user, code) {
  const conn = await banco.connect();
  try {
    await conn.query(
      `INSERT INTO password_resets (id_user, code_hash, expira_em, tentativas, janela_inicio)
       VALUES (?, ?, UTC_TIMESTAMP() + INTERVAL ? MINUTE, 0, UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE
         tentativas = IF(janela_inicio > UTC_TIMESTAMP() - INTERVAL 1 HOUR, tentativas, 0),
         janela_inicio = IF(janela_inicio > UTC_TIMESTAMP() - INTERVAL 1 HOUR, janela_inicio, UTC_TIMESTAMP()),
         code_hash = VALUES(code_hash),
         expira_em = VALUES(expira_em)`,
      [id_user, hashResetCode(id_user, code), RESET_CODE_TTL_MINUTES]
    );
  } finally { await conn.end(); }
}

// Confere o código e troca a senha numa transação. Retorna true só quando a senha foi trocada.
async function resetWithCode(email, code, makeHash) {
  const conn = await banco.connect();
  try {
    await conn.beginTransaction();
    const [[row]] = await conn.query(
      `SELECT u.id_user, r.code_hash, r.tentativas, r.expira_em > UTC_TIMESTAMP() AS valido
         FROM user u JOIN password_resets r ON r.id_user = u.id_user
        WHERE u.email = ? FOR UPDATE`,
      [email]
    );
    if (!row || !row.valido || row.tentativas >= RESET_MAX_ATTEMPTS) { await conn.rollback(); return false; }
    if (!resetCodeMatches(row.code_hash, row.id_user, code)) {
      await conn.query('UPDATE password_resets SET tentativas = tentativas + 1 WHERE id_user = ?', [row.id_user]);
      await conn.commit();
      return false;
    }
    await conn.query('UPDATE user SET senha = ? WHERE id_user = ?', [await makeHash(), row.id_user]);
    await conn.query('DELETE FROM password_resets WHERE id_user = ?', [row.id_user]);
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally { await conn.end(); }
}

export default { saveResetCode, resetWithCode };
