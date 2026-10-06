import express from 'express';
import db from '../services/loginService.js';
import { generateToken } from '../helpers/userFeatures.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try{
        const {email, senha} = request.body;

        const user = await db.login(email, senha);
        
        if (user) {            
            const token = generateToken({
                id_user: user.id_user, 
                email: user.email, 
                id_igreja: user.id_igreja, 
                nome: user.nome, 
                cargo: user.cargo,
                id_matriz: user.id_matriz,
                auth_tag: user.auth_tag
        });

            response.cookie('od_session', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 5 * 60 * 60 * 1000,
                path: '/',
            });
           
            response.status(200).json({ 
                message: "Login efetuado com sucesso.",
                user: {
                    id_user: user.id_user,
                    nome: user.nome,
                    cargo: user.cargo,
                    id_igreja: user.id_igreja,
                    id_matriz: user.id_matriz
                },
                token
            });

        }

        else{
            response.status(401).json({ message: "Credenciais inválidas" });
        }
    }

    catch (error) {
        console.error('Erro no login:', error);
        response.status(500).json({ error: 'Erro interno.' });
    }
});

routes.post('/logout', (_request, response) => {
    response.clearCookie('od_session', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
    response.status(200).json({ message: 'Sessão encerrada.' });
});

export default routes;
