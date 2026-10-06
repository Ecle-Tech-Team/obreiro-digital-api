import express, { request, response } from 'express';
import db from '../services/igrejaServices.js';
import verifyJWT from '../middlewares/jwt.js';
import { generateRegistrationToken } from '../helpers/userFeatures.js';
import securityRepository from '../repository/securityRepository.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz} = request.body;
        if (id_matriz) return response.status(403).json({ message: 'Vínculo com matriz requer autorização.' });

        if (!nome || !cnpj || !data_fundacao || !ministerio || !cep || !endereco || !bairro || !cidade) {
          return response.status(400).json({ message: 'Preencha os campos obrigatórios da igreja.' });
        }

        if (id_matriz) {
          const matriz = await db.getIgrejaById(id_matriz);
          if (!matriz || matriz.id_matriz !== null) {
            return response.status(400).json({ message: 'A igreja matriz fornecida não é válida.' });
          }
        }

        const id_igreja = await db.createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz || null);
        response.status(201).json({ message: 'Cadastro da igreja realizado com sucesso.', id_igreja, nome, registration_token: generateRegistrationToken(id_igreja) });
    } catch (error) {
        response.status(500).send('Erro interno.');
    }
});

routes.put('/:id_igreja', verifyJWT, async (request, response) => {
    try {
        const { id_igreja } = request.params;
        
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade,  } = request.body;

        await db.updateIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_igreja);

        response.status(200).send({ message: "Igreja atualizada com sucesso." });
    } catch (error) {
        response.status(500).send('Erro interno.');
    }
});

// Listar todas as igrejas subordinadas a uma matriz
routes.get('/subordinadas/:id_matriz', verifyJWT, async (request, response) => {
  try {
    const igrejas = await db.listarIgrejasSubordinadas(request.params.id_matriz);
    response.status(200).send(igrejas);
  } catch (error) {
    response.status(500).send('Erro interno.');
  }
});

// Listar igrejs subordinadas do usuário 
routes.get('/subordinadasUser/:id_user', async (req, res) => {
  try {
    const igreja = await db.getIgrejaById(req.user.id_igreja);
    if (!igreja || igreja.id_matriz != null) {
      return res.status(403).json({ message: 'Usuário não pertence a uma igreja matriz' });
    }
    const subordinadas = await db.listarIgrejasSubordinadas(igreja.id_igreja);
    res.status(200).json([igreja, ...subordinadas]);
  } catch (error) {
    console.error('Erro ao buscar igrejas subordinadas:', error);
    res.status(500).json({ error: 'Erro ao buscar igrejas subordinadas' });
  }
});


// Definir igreja como subordinada de uma matriz
routes.put('/igreja/vincular', verifyJWT, async (request, response) => {
  try {
    const { id_igreja, id_matriz } = request.body;
    await db.vincularIgrejaAMatriz(id_igreja, id_matriz);
    response.status(200).send("Igreja vinculada com sucesso");
  } catch (error) {
    response.status(500).send('Erro interno.');
  }
});

routes.get('/', async (request, response) => {
    try {
        const igrejas = await securityRepository.listVisibleChurches(request.user);
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send('Erro interno.');
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
    res.status(500).json({ error: 'Erro interno.' });
  }
});

routes.get('/count/subordinadas/:id_matriz', async (req, res) => {
  try {
    const { id_matriz } = req.params;
    const total = await db.countIgrejasSubordinadas(id_matriz);
    res.status(200).json(total);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default routes;
