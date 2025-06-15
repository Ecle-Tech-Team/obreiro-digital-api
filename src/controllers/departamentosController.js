import express from 'express';
import db from '../services/departamentosServices.js';
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

export default routes;