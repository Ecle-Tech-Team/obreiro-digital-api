import express from 'express';
import db from '../services/igrejaServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade} = request.body;

        await db.createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade);

        response.status(201).send({ message: "Cadastro da igreja realizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try {
        const igrejas = await db.getIgrejas();
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;