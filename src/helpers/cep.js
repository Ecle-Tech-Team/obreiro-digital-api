import cepPromise from 'cep-promise';
import express from 'express';

const routes = express.Router();

routes.post('/:cep', async (request, response) => {
    try {
        const { cep } = request.params;

        const consultCep = await cepPromise(cep);

        response.status(201).send(consultCep);
    } catch (error) {
        response.status(500).send(`Erro na requisição ${error}`);
    }
});

export default routes;