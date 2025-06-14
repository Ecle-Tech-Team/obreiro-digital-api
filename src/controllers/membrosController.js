import express from 'express';
import db from '../services/membrosServices.js';
import verifyJWT from '../middlewares/jwt.js';

const routes = express.Router();

routes.use(verifyJWT);

routes.post('/', async (request, response) => {
    try{       
        const{cod_membro, nome, numero, birth, novo_convertido, id_departamento}=request.body;
        
        const id_igreja = request.user.id_igreja;
        
        await db.createMembro(cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja);
        
        response.status(201).json({ message: "Membro cadastrado com sucesso" });
              
    } catch (error) {
        response.status(500).json({ error: `Erro: ${error.message}` });
    }
});

routes.get('/count/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalMembros = await db.countMembros(id_igreja);
        
        response.status(200).json(totalMembros);
    } catch (error) {
        response.status(500).json(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_membro/:id_igreja', async (request, response) => {
    try {
        const { id_membro, id_igreja } = request.params;
        
        const { cod_membro, nome, numero, birth, novo_convertido, id_departamento } = request.body;

        await db.updateMembro(id_membro, cod_membro, nome, numero, birth, novo_convertido, id_departamento, id_igreja);

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
});

routes.get('/membro/igreja', async (request, response) => {
    try {
        const igrejas = await db.getIgrejas();
        response.status(200).send(igrejas);        
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
        console.log(error)
    }
});

routes.get('/igreja/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;
        const { search } = request.query; 
        
        const membros = await db.selectMembro(id_igreja);

        if (membros.length > 0) {
            response.status(200).send(membros);
        } else {
            response.status(404).send("Nenhum membro encontrado!");
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', async (request, response) => {
    try {
        
        if (!request.user?.id_igreja) {
            return response.status(403).json({ error: "ID da igreja não encontrado no token" });
        }

        const membros = await db.selectMembro(request.user.id_igreja);
        
        response.status(200).json(membros);
    } catch (error) {
        console.error('Erro ao listar membros:', error);
        response.status(500).json({ error: 'Erro no servidor' });
    }
});

routes.delete('/:id_membro', async (request, response) => {
    try {
        const { id_membro } = request.params;

        await db.deleteMembro(id_membro);

        response.status(200).send({ message: "Membro removido com sucesso." });

    } catch (error) {        
        response.status(500).send(`Erro ao deletar membro: ${error}`);
    }
});

export default routes;