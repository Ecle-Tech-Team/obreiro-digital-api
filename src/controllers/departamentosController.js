import express from 'express';
import db from '../services/departamentosServices.js';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

routes.use(verifyJWT);

routes.post('/', async (request, response) => {
    try{
        const{nome, birth, data_congresso}=request.body;
       
        const id_igreja = request.user.id_igreja;

        await db.createDepartamentos(nome, birth, data_congresso, id_igreja);

        response.status(201).send({message: "Cadastro realizado com sucesso."})
              
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_departamento/:id_igreja', async (request, response) => {
    try {
        const { id_departamento, id_igreja } = request.params;
        
        const { nome, birth, data_congresso } = request.body;

        await db.updateDepartamento(id_departamento, nome, birth, data_congresso, id_igreja);

        response.status(200).send({ message: "Departamento atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try{        
        const id_igreja = request.user.id_igreja; 
        
        const departamento = await db.selectDepartamento(id_igreja);
 
        if (departamento) {
            response.status(200).send(departamento);
        } else {
            response.status(404).send("Departamento não encontrado!");
        }
    } catch (error){
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})

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

        const departamento = await db.selectDepartamento(id_igreja);

        if (departamento) {
            response.status(201).send(departamento);
        } else {
            response.status(404).send("Departamento não encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/matriz/:id_igreja', async (request, response) => {
    try {
    const { id_igreja } = request.params;

   const conn = await banco.connect();
    const [igrejaRows] = await conn.query(
      "SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja = ?",
      [id_igreja]
    );
    conn.end();

    const igreja = igrejaRows[0];

    if (!igreja) {
      return response.status(404).json({ error: "Igreja não encontrada" });
    }

    let departamentos = [];

    // Se a igreja for uma matriz
    if (igreja.id_igreja === igreja.id_matriz) {
      departamentos = await db.selectDepartamentosPorMatriz(igreja.id_igreja);
    } else {
      departamentos = await db.selectDepartamento(igreja.id_igreja);
    }

    response.status(200).json(departamentos);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    response.status(500).json({ error: "Erro ao buscar departamentos" });
  }
});

export default routes;