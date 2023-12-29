import express from 'express';
import db from '../services/estoqueServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario } = request.body;

        await db.createProduto(cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario);

        response.status(201).send({ message: "Produto adicionado ao estoque com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_produto', async (request, response) => {
    try {
        const { id_produto } = request.params;
        
        const { cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario } = request.body;

        await db.updateEstoque(id_produto, cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario);

        response.status(200).send({ message: "Produto atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try {
        const estoque = await db.selectEstoque();
        response.status(200).send(estoque);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/search', async (request, response) => {
    try {
        const { termoPesquisa } = request.query;

        if (!termoPesquisa) {
            return response.status(400).send("O parâmetro termoPesquisa é obrigatório.");
        }

        const produtosEncontrados = await db.searchProdutos(termoPesquisa);

        if (produtosEncontrados.length > 0) {
            response.status(200).send(produtosEncontrados);
        } else {
            response.status(404).send("Nenhum produto encontrado para o termo de pesquisa fornecido.");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;
