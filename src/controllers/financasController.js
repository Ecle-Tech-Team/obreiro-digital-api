import express from 'express';
import db from '../services/financasServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { tipo, categoria, valor, descricao, data, id_igreja } = request.body;

        const financasId = await db.createFinancas(tipo, categoria, valor, descricao, data, id_igreja);

        response.status(201).send({
            message: 'Movimentação financeira registrada com sucesso.',
            financasId,
        });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const financas = await db.getFinancas(id_igreja);

        response.status(200).send(financas);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error.message}`);
    }
  });
  
routes.get('/saldo/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const saldo = await db.getSaldo(id_igreja);

        response.status(200).send({ saldo });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error.message}`);
    }
});

routes.put('/:id_financas/:id_igreja', async (request, response) => {
    try {
        const { id_financas, id_igreja } = request.params;
        
        const { tipo, categoria, valor, descricao, data } = request.body;

        await db.updateFinancas(tipo, categoria, valor, descricao, data, id_igreja, id_financas);

        response.status(200).send({ message: "Movimentação atualizada com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;