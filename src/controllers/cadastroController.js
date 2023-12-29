import express from 'express';
import db from '../services/cadastroService.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const{cod_membro, nome, email, senha, birth, cargo}=request.body;

        await db.createUser(cod_membro, nome, email, senha, birth, cargo);

        response.status(201).send({message: "Cadastro realizado com sucesso."})
              
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_user', async (request, response) => {
    try {
        const { id_user } = request.params;
        
        const { cod_membro, nome, email, senha, birth, cargo } = request.body;

        await db.updateUser(id_user, cod_membro, nome, email, senha, birth, cargo);

        response.status(200).send({ message: "Usuário atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try{
        const { id_user } = request.params;

        const user = await db.selectUser(id_user);
 
        if (user) {
            response.status(201).send(user);
        } else {
            response.status(404).send("Usuário não encontrado!");
        }
    } catch (error){
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/:id_user', async (request, response) => {
    try {
        const { id_user } = request.params;
        const user = await db.selectUser(id_user);

        if (user) {
            response.status(200).send(user);
        } else {
            response.status(404).send("Usuário não encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

export default routes;