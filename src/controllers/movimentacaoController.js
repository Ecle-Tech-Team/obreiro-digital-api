import express from 'express';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();
routes.use(verifyJWT);

// Mover usuário para outra igreja
routes.put('/cadastro', async (req, res) => {
  const { id_user, nova_igreja_id } = req.body;
  const sql = "UPDATE user SET id_igreja = ? WHERE id_user = ?";
  const conn = await banco.connect();
  await conn.query(sql, [nova_igreja_id, id_user]);
  conn.end();
  res.status(200).send({ message: "Usuário movido com sucesso" });
});

// Mover membro
routes.put('/membro', async (req, res) => {
  const { id_membro, nova_igreja_id } = req.body;
  const sql = "UPDATE membro SET id_igreja = ? WHERE id_membro = ?";
  const conn = await banco.connect();
  await conn.query(sql, [nova_igreja_id, id_membro]);
  conn.end();
  res.status(200).send({ message: "Membro movido com sucesso" });
});

export default routes;
