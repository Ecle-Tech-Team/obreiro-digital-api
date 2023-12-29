import express from 'express';
import db from '../services/loginService.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const {email, senha} = request.body;

        const user = await db.login(email, senha);
        
        if (user.length > 0) {
            response.status(201).send({message:"Login efetuado com sucesso.", user});

            return true;
        }

        else{
            response.status(401).send("Login incorreto!");

            return false;
        }
    }

    catch (error) {
        response.status(500).send(`Houve um erro no banco de dados ${error}`);
    }
});

export default routes;