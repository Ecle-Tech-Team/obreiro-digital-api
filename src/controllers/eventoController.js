import express from 'express';
import db from '../services/eventoServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, data_inicio, horario_inicio, data_fim, horario_fim, local } = request.body;

        await db.createEvento(nome, data_inicio, horario_inicio, data_fim, horario_fim, local);

        response.status(201).send({ message: "Evento cadastrado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try {
        const eventos = await db.selectEventos();
        response.status(200).send(eventos);
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

routes.get('/count', async (request, response) => {
    try {
        const totalEventos = await db.countEventos();
        response.status(200).send(totalEventos);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;