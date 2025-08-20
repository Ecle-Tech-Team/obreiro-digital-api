import express from 'express';
import db from '../services/avisosServices.js';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

// Todas as rotas protegidas por JWT
routes.use(verifyJWT);

routes.post('/', async (req, res) => {
    try {
        const { titulo, conteudo, is_global } = req.body;

        const id_igreja = req.user.id_igreja;

         let id_matriz = null;
                if (is_global) {
                    const conn = await banco.connect();
                    const [igrejaInfo] = await conn.query("SELECT id_matriz FROM igreja WHERE id_igreja = ?", [id_igreja]);
                    conn.end();
                    id_matriz = igrejaInfo[0]?.id_matriz || id_igreja; // Se a própria é matriz, usa ela mesma
                }

        const idAviso = await db.createAviso(titulo, conteudo, id_igreja, is_global, id_matriz);
        res.status(201).send({ message: 'Aviso criado com sucesso', id_aviso: idAviso });
    } catch (error) {
        res.status(500).send(`Erro ao criar aviso: ${error}`);
    }
});

routes.get('/:id_igreja', async (req, res) => {
    try {
        const { id_igreja } = req.params;
        
        const avisos = await db.selectAvisos(id_igreja);
        
        res.status(201).send(avisos);
    } catch (error) {
        res.status(500).send(`Erro ao buscar avisos: ${error}`);
    }
});

routes.get('/matriz/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const avisos = await db.selectAvisosComMatriz(id_igreja);

        if (avisos && avisos.length > 0) {
            response.status(200).send(avisos);
        } else {
            response.status(404).send("Nenhum aviso encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_aviso', async (req, res) => {
    try {
        const { id_aviso } = req.params;
        const { titulo, conteudo } = req.body;
        await db.editAviso(id_aviso, titulo, conteudo);
        res.status(200).send({ message: 'Aviso atualizado com sucesso' });
    } catch (error) {
        res.status(500).send(`Erro ao atualizar aviso: ${error}`);
    }
});

routes.delete('/:id_aviso', async (req, res) => {
    try {
        const { id_aviso } = req.params;

        await db.deleteAviso(id_aviso);
        
        res.status(200).send({ message: 'Aviso deletado com sucesso' });
    } catch (error) {
        res.status(500).send(`Erro ao deletar aviso: ${error}`);
    }
});

export default routes;
