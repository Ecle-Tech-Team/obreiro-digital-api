import express from 'express';
import db from '../services/cadastroService.js';
import verifyJWT from '../middlewares/jwt.js';
import reportService from '../services/reportServices.js';

const routes = express.Router();

routes.post('/', verifyJWT, async (req, res) => {
    try {
        const { motivo, descricao } = req.body;
        const { id_user } = req.user;       

        if (!motivo || !descricao) {
            return res.status(400).send("Motivo e descrição são obrigatórios.");
        }

        const user = await db.getUserById(id_user);

        if (!user) {
          return res.status(404).send("Usuário não encontrado.");
        }

        await reportService.createReport(id_user, motivo, descricao, user.nome, user.email);


        res.status(201).send({ message: "Relatório enviado com sucesso." });
    } catch (error) {
        console.error("Erro ao enviar relatório:", error);
        res.status(500).send("Erro ao enviar relatório.");
    }
});

export default routes;
