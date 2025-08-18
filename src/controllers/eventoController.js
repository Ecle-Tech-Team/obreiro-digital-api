import express from 'express';
import db from '../services/eventoServices.js';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

// Todas as rotas protegidas por JWT
routes.use(verifyJWT);

routes.post('/', async (request, response) => {
    try {
        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local, is_global } = request.body;
        const id_igreja = request.user.id_igreja;

         // Se for global, pegamos a matriz dessa igreja
        let id_matriz = null;
        if (is_global) {
            const conn = await banco.connect();
            const [igrejaInfo] = await conn.query("SELECT id_matriz FROM igreja WHERE id_igreja = ?", [id_igreja]);
            conn.end();
            id_matriz = igrejaInfo[0]?.id_matriz || id_igreja; // Se a própria é matriz, usa ela mesma
        }

        await db.createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz);

        response.status(201).send({ message: "Evento cadastrado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/igreja', async (request, response) => {
    try {
        const igrejas = await db.getIgrejas();
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const eventos = await db.selectEventos(id_igreja);

        if (eventos) {
            response.status(201).send(eventos);
        } else {
            response.status(404).send("Evento não encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_evento', async (request, response) => {
    try {
        const { id_evento } = request.params;

        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local } = request.body;

        await db.updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local);

        response.status(200).send({ message: "Evento atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/count/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalEventos = await db.countEventos(id_igreja);

        response.status(200).json(totalEventos);
    } catch (error) {
        response.status(500).json(`Erro na requisição! ${error}`);
    }
});

import avisoDb from '../services/avisosServices.js';
import { startOfWeek, endOfWeek } from 'date-fns';

routes.get('/semana/:id_igreja', async (request, response) => {
  try {
    const { id_igreja } = request.params;

    const hoje = new Date();
    const semanaInicio = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda
    const semanaFim = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo

    const eventos = await db.selectEventosSemana(id_igreja, semanaInicio, semanaFim);
    const avisos = await avisoDb.selectAvisos(id_igreja); // assumindo todos avisos da semana já ordenados por data

    response.status(200).json({ eventos, avisos });
  } catch (error) {
    response.status(500).send(`Erro ao buscar eventos e avisos da semana: ${error}`);
  }
});

routes.get('/matriz/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const eventos = await db.selectEventosComMatriz(id_igreja);

        if (eventos && eventos.length > 0) {
            response.status(200).send(eventos);
        } else {
            response.status(404).send("Nenhum evento encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.delete('/:id_evento', async (req, res) => {
    try {
        const { id_evento } = req.params;

        await db.deleteEvento(id_evento);
        
        res.status(200).send({ message: 'Evento deletado com sucesso' });
    } catch (error) {
        res.status(500).send(`Erro ao deletar evento: ${error}`);
    }
});

export default routes;