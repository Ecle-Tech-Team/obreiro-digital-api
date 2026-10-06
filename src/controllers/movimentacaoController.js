import express from 'express';
import banco from '../repository/connection.js';

export function createMovementService(database) {
  async function move(table, column, id, destination, actorChurch) {
    const conn = await database.connect();
    try {
      await conn.beginTransaction();
      const [[record]] = await conn.query(`SELECT id_igreja FROM ${table} WHERE ${column} = ? FOR UPDATE`, [id]);
      if (!record) throw new Error('Registro não encontrado.');
      const [churches] = await conn.query('SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja IN (?, ?) FOR UPDATE', [record.id_igreja, destination]);
      const own = id => Number(id) === Number(actorChurch);
      const valid = id => churches.some(church => Number(church.id_igreja) === Number(id) && (own(id) || own(church.id_matriz)));
      if (!valid(record.id_igreja) || !valid(destination)) throw new Error('Igreja fora da hierarquia.');
      const sql = table === 'membro'
        ? 'UPDATE membro SET id_igreja = ?, id_departamento = NULL WHERE id_membro = ? AND id_igreja = ?'
        : 'UPDATE user SET id_igreja = ? WHERE id_user = ? AND id_igreja = ?';
      const [result] = await conn.query(sql, [destination, id, record.id_igreja]);
      if (result.affectedRows !== 1) throw new Error('Movimentação não realizada.');
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally { await conn.end(); }
  }
  return {
    moveUser: (id, destination, actorChurch) => move('user', 'id_user', id, destination, actorChurch),
    moveMember: (id, destination, actorChurch) => move('membro', 'id_membro', id, destination, actorChurch),
  };
}

const movement = createMovementService(banco);
const routes = express.Router();

routes.put('/cadastro', async (req, res, next) => {
  try {
    await movement.moveUser(req.body.id_user, req.body.nova_igreja_id, req.user.id_igreja);
    res.status(200).send({ message: 'Usuário movido com sucesso' });
  } catch (error) { next(error); }
});

routes.put('/membro', async (req, res, next) => {
  try {
    await movement.moveMember(req.body.id_membro, req.body.nova_igreja_id, req.user.id_igreja);
    res.status(200).send({ message: 'Membro movido com sucesso' });
  } catch (error) { next(error); }
});

export default routes;
