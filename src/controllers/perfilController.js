import express, { request, response } from 'express';
import db from '../services/perfilService.js';

const routes = express.Router();

routes.get('/:id_employee', async (request, response) =>{
    try{
        const { id_employee } = request.params;

        const employee = await db.selectEmployee(id_employee);

        if (employee) {
            response.status(201).send(employee)
        }

        else {
            response.status(404).send("Funcionario não encontrado!")
        }
    }

    catch (error) {
        response.status(500).send(`Erro na requisição ${error}`);
    }
});

routes.put('/:id', async (request, response) => {
    try{
        const { id } = request.params;

        const {password} = request.body;

        const update = await db.updateEmployee(id, password);
        
        console.log(update)

        if (update) {
            response.status(201).send("Dados atualizados com sucesso.");
        }

        else {
            response.status(404).send("Funcionario não encontrado!");
        }
    }

    catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})

export default routes;