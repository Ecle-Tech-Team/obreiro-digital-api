import express from 'express';
import db from '../services/visitantesServices.js';
import securityRepository from '../repository/securityRepository.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const{nome, cristao, data_visita, congregacao, ministerio, convidado_por, id_igreja}=request.body;

        await db.createVisitante(nome, cristao, data_visita, congregacao, ministerio, convidado_por, id_igreja);

        response.status(201).send({message: "Cadastro realizado com sucesso."})

    } catch (error) {
        response.status(500).send('Erro interno.');
    }
});

routes.get('/igreja', async (request, response) => {
    try {
        const igrejas = await securityRepository.listVisibleChurches(request.user);
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send('Erro interno.');
        console.log(error)
    }
});

routes.get('/membros', async (request, response) => {
    try{
        const membros = await db.selectMembros(request.user.id_igreja);

        response.status(201).send(membros);
    } catch (error) {
        response.status(500).send('Erro interno.')
    }
});

routes.get('/:id_igreja', async (request, response) => {
    try{
        const { id_igreja } = request.params;

        const visitante = await db.selectVisitantes(id_igreja);

        if (visitante) {
            response.status(200).send(visitante);
        } else {
            response.status(404).send("Visitante não encontrado!");
        }
    } catch (error){
        response.status(500).send('Erro interno.');
    }
});

routes.get('/count/:id_igreja', async (request, response) => {
    try {
        const { id_igreja } = request.params;

        const totalVisitantes = await db.countVisitantes(id_igreja);

        response.status(200).json(totalVisitantes);
    } catch (error) {
        response.status(500).json({ error: 'Erro interno.' });
    }
});

export default routes;
