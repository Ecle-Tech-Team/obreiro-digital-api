import express from 'express';
import db from '../services/eventoServices.js';
import verifyJWT from '../middlewares/jwt.js';
import securityRepository from '../repository/securityRepository.js';

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
            const igrejaInfo = await securityRepository.getChurch(id_igreja);
            id_matriz = igrejaInfo?.id_matriz || id_igreja; // Se a própria é matriz, usa ela mesma
        }

        await db.createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja, is_global, id_matriz);

        response.status(201).send({ message: "Evento cadastrado com sucesso." });
    } catch (error) {
        response.status(500).send('Erro interno.');
    }
});

routes.get('/igreja', async (request, response) => {
    try {
        const igrejas = await securityRepository.listVisibleChurches(request.user);
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send('Erro interno.');
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
        response.status(500).send('Erro interno.');
    }
});

routes.put('/:id_evento', async (request, response) => {
    try {
        const { id_evento } = request.params;

        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local } = request.body;

        await db.updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local, request.user.id_igreja);

        response.status(200).send({ message: "Evento atualizado com sucesso." });
    } catch (error) {
        response.status(500).send('Erro interno.');
    }
});

routes.get('/count/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalEventos = await db.countEventos(id_igreja);

        response.status(200).json(totalEventos);
    } catch (error) {
        response.status(500).json({ error: 'Erro interno.' });
    }
});

import avisoDb from '../services/avisosServices.js';
import { startOfWeek, endOfWeek } from 'date-fns';

routes.get('/semana/:id_igreja/:id_matriz', async (request, response) => {
  try {
    const { id_igreja, id_matriz } = request.params;

    const hoje = new Date();
    const semanaInicio = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda
    const semanaFim = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo

    const eventos = await db.selectEventosSemana(id_igreja, id_matriz, semanaInicio, semanaFim);
    const avisos = await avisoDb.selectAvisosComMatriz(id_igreja);

    response.status(200).json({ eventos, avisos });
  } catch (error) {
    response.status(500).send('Erro interno.');
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
        response.status(500).send('Erro interno.');
    }
});

routes.delete('/:id_evento', async (req, res) => {
    try {
        const { id_evento } = req.params;

        await db.deleteEvento(id_evento, req.user.id_igreja);
        
        res.status(200).send({ message: 'Evento deletado com sucesso' });
    } catch (error) {
        res.status(500).send('Erro interno.');
    }
});

export default routes;
