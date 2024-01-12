import express from 'express';
import db from '../services/membrosServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const{cod_membro, nome, numero, birth, novo_convertido, depart}=request.body;

        await db.createMembro(cod_membro, nome, numero, birth, novo_convertido, depart);

        response.status(201).send({message: "Cadastro realizado com sucesso."})
              
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/count', async (request, response) => {
    try {
        const totalMembros = await db.countMembros();
        response.status(200).json(totalMembros);
    } catch (error) {
        response.status(500).json(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_membro', async (request, response) => {
    try {
        const { id_membro } = request.params;
        
        const { cod_membro, nome, numero, birth, novo_convertido, depart } = request.body;

        await db.updateMembro(id_membro, cod_membro, nome, numero, birth, novo_convertido, depart);

        response.status(200).send({ message: "Membro atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/departamentos', async (request, response) => {
    try{
        const departamento = await db.selectDepartamentos();

        response.status(201).send(departamento);
    } catch (error) {
        response.status(500).send(`Erro ao consultar cargo! ${error}`)
    }
})

routes.get('/:id_membro', async (request, response) => {
    try{
        const { id_membro } = request.params;

        const membro = await db.selectMembroOnly(id_membro);
 
        if (membro) {
            response.status(201).send(membro);
        } else {
            response.status(404).send("Membro não encontrado!");
        }
    } catch (error){
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})

routes.get('/', async (request, response) => {
    try{
        const { id_membro } = request.params;

        const membro = await db.selectMembro(id_membro);
 
        if (membro) {
            response.status(200).send(membro);
        } else {
            response.status(404).send("Membro não encontrado!");
        }
    } catch (error){
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})

export default routes;