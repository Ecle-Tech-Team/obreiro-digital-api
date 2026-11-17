import express from 'express';
import filiais, { FilialError } from '../services/filialServices.js';

const routes = express.Router();

const fail = (response, error) => error instanceof FilialError
  ? response.status(error.status).json({ message: error.message })
  : response.status(500).json({ message: 'Erro interno.' });

// Pastor Matriz gera o link de convite para o pastor de uma filial sua.
routes.post('/', async (request, response) => {
  try {
    const result = await filiais.createInvite(request.body?.id_igreja, request.user.id_igreja, request.user.id_user);
    response.status(201).json(result);
  } catch (error) { fail(response, error); }
});

// Público: mostra para quem abriu o link qual igreja o convidou.
routes.post('/validar', async (request, response) => {
  try {
    response.status(200).json(await filiais.getInvite(request.body?.token));
  } catch (error) { fail(response, error); }
});

export default routes;
