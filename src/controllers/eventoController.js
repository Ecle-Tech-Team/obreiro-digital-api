import express from 'express';
import db from '../services/eventoServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja } = request.body;

        await db.createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja);

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

routes.put('/:id_evento/:id_igreja', async (request, response) => {
    try {
        const { id_evento, id_igreja } = request.params;
        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local } = request.body;

        await db.updateEvento(id_evento, nome, data_inicio, horario_inicio, data_fim, horario_fim, local, id_igreja);

        response.status(200).send({ message: "Evento atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/count', async (request, response) => {
    try {
        const totalEventos = await db.countEventos();
        response.status(200).json(totalEventos);
    } catch (error) {
        response.status(500).json(`Erro na requisição! ${error}`);
    }
});

export default routes;