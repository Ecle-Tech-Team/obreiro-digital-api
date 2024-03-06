import express from 'express';
import db from '../services/pedidoServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome_produto, categoria_produto,quantidade, data_pedido, id_igreja } = request.body;

        await db.createPedido(nome_produto, categoria_produto, quantidade, data_pedido, id_igreja);

        response.status(201).send({ message: "Pedido realizado com sucesso." });
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
        
        const pedidos = await db.selectPedidos(id_igreja);

        response.status(200).send(pedidos);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_pedido/:id_igreja', async (request, response) => {
    try {
        const { id_pedido, id_igreja } = request.params;
        const { nome_produto, categoria_produto, quantidade, data_pedido, status_pedido } = request.body;

        await db.updatePedidos(id_pedido, nome_produto, categoria_produto, quantidade, data_pedido, status_pedido, id_igreja);

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

routes.get('/count/entregue/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalPedidosEntregues = await db.countPedidosEntregues(id_igreja);

        response.status(200).json(totalPedidosEntregues);
    } catch (error) {
        console.error('Erro ao contar pedidos entregues:', error);
        response.status(500).json({ error: 'Erro na requisição!' });
    }
});

routes.get('/count/em-andamento/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalPedidosEmAndamento = await db.countPedidosEmAndamento(id_igreja);

        response.status(200).json(totalPedidosEmAndamento);
    } catch (error) {
        console.error('Erro ao contar pedidos em andamento:', error);
        response.status(500).json({ error: 'Erro na requisição!' });
    }
});

routes.get('/count/recusados/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalPedidosRecusados = await db.countPedidosRecusados(id_igreja);

        response.status(200).json(totalPedidosRecusados);
    } catch (error) {
        console.error('Erro ao contar pedidos recusados:', error);
        response.status(500).json({ error: 'Erro na requisição!' });
    }
});

routes.get('/count/total/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalPedidos = await db.countPedidosTotais(id_igreja);

        response.status(200).json(totalPedidos);
    } catch (error) {
        console.error('Erro ao contar pedidos totais:', error);
        response.status(500).json({ error: 'Erro na requisição!' });
    }
});

export default routes;