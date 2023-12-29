import express from 'express';
import db from '../services/visitantesServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const{nome, cristao, data_visita, congregacao, ministerio, convidado_por}=request.body;

        console.log('Valores recebidos:', request.body);

        await db.createVisitante(nome, cristao, data_visita, congregacao, ministerio, convidado_por);

        response.status(201).send({message: "Cadastro realizado com sucesso."})
              
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/membros', async (request, response) => {
    try{
        const membros = await db.selectMembros();        

        response.status(201).send(membros);
    } catch (error) {
        response.status(500).send(`Erro ao consultar cargo! ${error}`)
    }
});

routes.get('/', async (request, response) => {
    try{
        const { id_visitante } = request.params;

        const visitante = await db.selectVisitantes(id_visitante);
 
        if (visitante) {
            response.status(200).send(visitante);
        } else {
            response.status(404).send("Visitante não encontrado!");
        }
    } catch (error){
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})
export default routes;