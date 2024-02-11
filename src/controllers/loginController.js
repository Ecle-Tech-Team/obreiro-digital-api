import express from 'express';
import db from '../services/loginService.js';
import { generateToken } from '../helpers/userFeatures.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const {email, senha} = request.body;

        const user = await db.login(email, senha);
        
        if (user.length > 0) {
            const id_igreja = user.id_igreja;
            
            const token = generateToken(user.id_user, user.email, id_igreja);
            
            console.log(token) 
            response.status(201).send({ message:"Login efetuado com sucesso.", user, token });

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