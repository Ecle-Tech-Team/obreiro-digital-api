import express, { request, response } from 'express';
import db from '../services/igrejaServices.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz} = request.body;

        await db.createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz);

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

// Listar todas as igrejas subordinadas a uma matriz
routes.get('/subordinadas/:id_matriz', verifyJWT, async (request, response) => {
  try {
    const igrejas = await db.listarIgrejasSubordinadas(request.params.id_matriz);
    response.status(200).send(igrejas);
  } catch (error) {
    response.status(500).send("Erro ao buscar igrejas subordinadas: " + error);
  }
});

// Definir igreja como subordinada de uma matriz
routes.put('/igreja/vincular', verifyJWT, async (request, response) => {
  try {
    const { id_igreja, id_matriz } = request.body;
    await db.vincularIgrejaAMatriz(id_igreja, id_matriz);
    response.status(200).send("Igreja vinculada com sucesso");
  } catch (error) {
    response.status(500).send("Erro ao vincular igreja: " + error);
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