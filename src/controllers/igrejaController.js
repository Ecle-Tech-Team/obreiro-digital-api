import express from 'express';
import db from '../services/igrejaServices.js';
import verifyJWT from '../middlewares/jwt.js';

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

routes.put('/:id_igreja', verifyJWT, async (request, response) => {
    try {
        const { id_igreja } = request.params;
        
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade,  } = request.body;

        await db.updateIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja);

        response.status(200).send({ message: "Igreja atualizada com sucesso." });
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

routes.get('/:id_igreja', verifyJWT, async (req, res) => {
  try {
    const { id_igreja } = req.params;
    
    const igreja = await db.getIgrejaById(id_igreja);
    
    if (igreja) {
      res.status(200).json(igreja);
    } else {
      res.status(404).json({ message: "Igreja não encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default routes;