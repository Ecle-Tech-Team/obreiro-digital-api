import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import banco from '../repository/connection.js';
import { hashPassword } from '../helpers/password.js';

export async function migratePasswords(database) {
  const conn = await database.connect();
  let lastId = 0;
  let migrated = 0;
  try {
    while (true) {
      const [users] = await conn.query('SELECT id_user, senha FROM user WHERE id_user > ? ORDER BY id_user LIMIT 100', [lastId]);
      if (users.length === 0) break;
      for (const user of users) {
        lastId = user.id_user;
        if (user.senha.startsWith('$scrypt$')) continue;
        const hashed = await hashPassword(user.senha, { allowShort: true });
        const [result] = await conn.query('UPDATE user SET senha = ? WHERE id_user = ? AND senha = ?', [hashed, user.id_user, user.senha]);
        if (result.affectedRows === 1) migrated++;
      }
    }
    return migrated;
  } finally { await conn.end(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const migrated = await migratePasswords(banco);
  console.log(`Contas migradas: ${migrated}`);
}
