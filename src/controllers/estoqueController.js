import express from 'express';
import db from '../services/estoqueServices.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

routes.use(verifyJWT);

routes.post('/', async (request, response) => {
    try {
        const { cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario } = request.body;

        const id_igreja = request.user.id_igreja;

        await db.createProduto(cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja);

        response.status(201).send({ message: "Produto adicionado ao estoque com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_produto/:id_igreja', async (request, response) => {
    try {
        const { id_produto, id_igreja } = request.params;
        
        const { cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario } = request.body;

        await db.updateEstoque(id_produto, cod_produto, categoria, nome_produto, quantidade, validade, preco_unitario, id_igreja);

        response.status(200).send({ message: "Produto atualizado com sucesso." });
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

        const estoque = await db.selectEstoque(id_igreja);
        
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

routes.delete('/:id_produto', async (request, response) => {
    try {
        const { id_produto } = request.params;

        await db.deleteProduto(id_produto);

        response.status(200).send({ message: "Produto removido com sucesso." });

    } catch (error) {        
        response.status(500).send(`Erro ao deletar produto: ${error}`);
    }
});

export default routes;
