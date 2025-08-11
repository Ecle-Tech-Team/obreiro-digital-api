import express from 'express';
import db from '../services/cadastroService.js';
import banco from '../repository/connection.js';
import verifyJWT from '../middlewares/jwt.js';
import sendEmail from '../services/emailServices.js';

const routes = express.Router();

routes.post('/', async (request, response) => {
    try {
        const{ cod_membro, nome, email, senha, birth, cargo, id_igreja } = request.body;

        await db.createUser(cod_membro, nome, email, senha, birth, cargo, id_igreja);

        response.status(201).send({message: "Cadastro realizado com sucesso."})
              
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.put('/:id_user', verifyJWT, async (request, response) => {
    try {
        const { id_user } = request.params;
        
        const { email, senha, ...userData } = request.body;
        
        const user = await db.getUserById(id_user);

        if (!user) {
            return response.status(404).send("Usuário não encontrado.");
        }

        const oldEmail = user.email;

        const userDataToUpdate = { ...userData };
        if (email) userDataToUpdate.email = email;
        if (senha) userDataToUpdate.senha = senha;

        await db.updateUserPartial(id_user, userDataToUpdate);

        if (email && oldEmail && email !== oldEmail) {
            await sendEmail(
                oldEmail && email,
                'Seu email foi alterado',
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">                        
                        <h2 style="color: #15616D;">Confirmação de Alteração de Email</h2>                        
                        <p>Olá,</p>
                        <p>Informamos que o email da sua conta foi alterado com sucesso.</p>
                        <p>Se você não reconhece essa alteração, entre em contato com o suporte imediatamente.</p>
                        <h4 style="color: #15616D;">Atenciosamente,<br>Equipe Obreiro Digital</h4>
                        <br/>
                        <p style="font-size: 12px; color: #888;">Este é um email automático, por favor, não responda.</p>
                    </div>
                `
            );
        }

        else if (senha){
            await sendEmail(
                user.email,
                'Sua senha foi alterada',
                `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">                        
                        <h2 style="color: #15616D;">Confirmação de Alteração de Senha</h2>                        
                        <p>Olá,</p>
                        <p>Informamos que a senha da sua conta foi alterada com sucesso.</p>
                        <p>Se você não reconhece essa alteração, entre em contato com o suporte imediatamente.</p>
                        <h4 style="color: #15616D;">Atenciosamente,<br>Equipe Obreiro Digital</h4>
                        <br/>
                        <p style="font-size: 12px; color: #888;">Este é um email automático, por favor, não responda.</p>
                    </div>
                `
            );
        
        }

        response.status(200).send({ message: "Usuário atualizado com sucesso." });
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/cadastro', verifyJWT, async (request, response) => {
    console.log('Rota de cadastro acessada');
    try{
        const { id_igreja } = request.params;

        const users = await db.selectUserIdIgreja(id_igreja);

        response.status(200).send(users);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/', verifyJWT, async (request, response) => {
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

routes.get('/obreiros/:id_igreja', verifyJWT, async (request, response) => {
    try {
        const { id_igreja } = request.params;
        const consult = await db.selectUserIdIgreja(id_igreja);

        if (consult.length > 0) {
            response.status(200).send(consult)
        } else {
            response.status(201).send(consult);
        }
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
})

routes.get('/cadastro/igreja', async (request, response) => {
    try {
        const igrejas = await db.getIgrejas();
        response.status(200).send(igrejas);
    } catch (error) {
        response.status(500).send(`Erro na requisição! ${error}`);
    }
});

routes.get('/matriz/:id_igreja', verifyJWT, async (request, response) => {
    try {
    const { id_igreja } = request.params;

    const conn = await banco.connect();
    const [igrejaRows] = await conn.query(
      "SELECT id_igreja, id_matriz FROM igreja WHERE id_igreja = ?",
      [id_igreja]
    );
    conn.end();

    const igreja = igrejaRows[0];

    if (!igreja) {
      return response.status(404).json({ error: "Igreja não encontrada" });
    }

    let user = [];

    // Se a igreja for uma matriz
    if (igreja.id_igreja === igreja.id_matriz) {
      user = await db.selectUsersPorMatriz(igreja.id_igreja);
    } else {
      user = await db.selectUserIdIgreja(igreja.id_igreja);
    }

    response.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    response.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

routes.delete('/:id_user', verifyJWT, async (request, response) => {
    try {
        const { id_user } = request.params;

        await db.deleteUser(id_user);

        response.status(200).send({ message: "Usuário removido com sucesso." });

    } catch (error) {        
        response.status(500).send(`Erro ao deletar usuário: ${error}`);
    }
});

export default routes;