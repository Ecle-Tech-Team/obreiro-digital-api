import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migratePasswords } from '../src/scripts/migratePasswords.js';

test('migração de senha legada usa hash e atualização condicionada', async () => {
  const writes = [];
  const connection = {
    query: async (sql, values) => {
      if (sql.startsWith('SELECT')) return [values[0] === 0 ? [{ id_user: 1, senha: 'legacy' }] : []];
      writes.push([sql, values]);
      return [{ affectedRows: 1 }];
    },
    end: async () => {},
  };
  const result = await migratePasswords({ connect: async () => connection });
  assert.equal(result, 1);
  assert.equal(writes.length, 1);
  assert.match(writes[0][1][0], /^\$scrypt\$/);
  assert.deepEqual(writes[0][1].slice(1), [1, 'legacy']);
});
