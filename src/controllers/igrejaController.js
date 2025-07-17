import express, { request, response } from 'express';
import db from '../services/igrejaServices.js';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const { nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz} = request.body;

        await db.createIgreja(nome, cnpj, data_fundacao, setor, ministerio, cep, endereco, bairro, cidade, id_matriz);
        
        if (!id_matriz) {
          return response.status(400).json({ message: "id_matriz é obrigatório para igrejas subordinadas." });
        }

        const [[matrizExiste]] = await conn.query(
          'SELECT * FROM igreja WHERE id_igreja = ? AND id_matriz IS NULL',
          [id_matriz]
        );

        if (!matrizExiste) {
          return response.status(400).json({ message: "A igreja matriz fornecida não existe ou não é uma matriz válida." });
        }
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

// Listar igrejs subordinadas do usuário 
routes.get('/subordinadasUser/:id_user', async (req, res) => {
  const { id_user } = req.params;

  try {
    const conn = await banco.connect();

    // 1. Pegar o id_igreja do usuário
    const [[usuario]] = await conn.query(
      'SELECT id_igreja FROM user WHERE id_user = ?',
      [id_user]
    );

    if (!usuario || !usuario.id_igreja) {
      return res.status(404).json({ message: 'Usuário não encontrado ou sem igreja associada' });
    }

    const idIgrejaUsuario = usuario.id_igreja;

    // 2. Verificar se a igreja do usuário é uma matriz
    const [[igrejaUsuario]] = await conn.query(
      'SELECT * FROM igreja WHERE id_igreja = ? AND id_matriz IS NULL',
      [idIgrejaUsuario]
    );

    if (!igrejaUsuario) {
      return res.status(403).json({ message: 'Usuário não pertence a uma igreja matriz' });
    }

    // 3. Buscar todas as igrejas subordinadas a essa matriz
    const [igrejasSubordinadas] = await conn.query(
      'SELECT * FROM igreja WHERE id_matriz = ?',
      [idIgrejaUsuario]
    );
    conn.end();
    res.status(200).json(igrejasSubordinadas);
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