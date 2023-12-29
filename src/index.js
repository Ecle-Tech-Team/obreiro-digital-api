import express from 'express';
import routes from './routes.js';
import cors from 'cors';

const api = express();

api.use(express.json());

api.use(cors());

api.use('/', routes);

api.listen (3333, () => {
    console.log('Servidor em produção...');
});