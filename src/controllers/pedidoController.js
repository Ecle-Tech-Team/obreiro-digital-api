import express from 'express';
import db from '../services/pedidoServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome_produto, categoria_produto,quantidade, data_pedido } = request.body;

        await db.createPedido(nome_produto, categoria_produto, quantidade, data_pedido);

        response.status(201).send({ message: "Pedido realizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try {
        const pedidos = await db.selectPedidos();

        response.status(200).send(pedidos);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_pedido', async (request, response) => {
    try {
        const { id_pedido } = request.params;
        const { nome_produto, categoria_produto, quantidade, data_pedido, status_pedido } = request.body;

        await db.updatePedidos(id_pedido, nome_produto, categoria_produto, quantidade, data_pedido, status_pedido);

        response.status(200).send({ message: "Pedido atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_pedido/responder', async (request, response) => {
    try {
        const { id_pedido } = request.params;
        const { status_pedido, data_entrega, motivo_recusa } = request.body;

        await db.responderPedido(id_pedido, status_pedido, data_entrega, motivo_recusa);

        response.status(200).send({ message: "Resposta do pedido registrada com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;