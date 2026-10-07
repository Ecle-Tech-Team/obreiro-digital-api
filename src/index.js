import express from 'express';
import routes from './routes.js';
import cors from 'cors';
import verifyJWT from './middlewares/jwt.js';
import { createSecurityGate } from './middlewares/security.js';
import securityRepository from './repository/securityRepository.js';
import { createRateLimiter } from './middlewares/rateLimit.js';
import { incrementRateLimit } from './repository/rateLimitStore.js';
import { tokenSecret } from './helpers/tokenSecret.js';

tokenSecret();

const api = express();
if (process.env.TRUST_PROXY_CIDRS) api.set('trust proxy', process.env.TRUST_PROXY_CIDRS.split(',').map(value => value.trim()));

api.use(express.json());

const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(origin => origin.trim());
api.use(cors({ credentials: true, origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    const error = new Error('Origem não permitida.');
    error.status = 403;
    return callback(error);
} }));

const limits = {
    login: createRateLimiter({ max: 10, windowMs: 15 * 60_000, store: incrementRateLimit }),
    recuperarLogin: createRateLimiter({ max: 5, windowMs: 60 * 60_000, store: incrementRateLimit }),
    cadastro: createRateLimiter({ max: 10, windowMs: 60 * 60_000, store: incrementRateLimit }),
    igreja: createRateLimiter({ max: 5, windowMs: 60 * 60_000, store: incrementRateLimit }),
    cep: createRateLimiter({ max: 30, windowMs: 60 * 60_000, store: incrementRateLimit }),
    report: createRateLimiter({ max: 5, windowMs: 60 * 60_000, store: incrementRateLimit }),
};
api.use((request, response, next) => {
    if (request.method !== 'POST') return next();
    const route = request.path.split('/')[1];
    return limits[route] ? limits[route](request, response, next) : next();
});

api.use((request, response, next) => {
    const publicRoute = (request.path === '/login' && request.method === 'POST')
        || (request.path.startsWith('/recuperarLogin') && request.method === 'POST')
        || (request.path.startsWith('/cep/') && request.method === 'POST')
        || (request.path === '/igreja' && request.method === 'POST')
        || (request.path === '/cadastro' && request.method === 'POST' && !!request.body?.registration_token);
    if (publicRoute) return next();
    return verifyJWT(request, response, next);
});
api.use(createSecurityGate(securityRepository));

api.use('/', routes);

api.use((error, _request, response, _next) => {
    if (error.status === 403) return response.status(403).json({ message: 'Origem não permitida.' });
    console.error('Erro na API:', error);
    response.status(500).json({ message: 'Erro interno.' });
});

api.listen (Number(process.env.API_PORT || 3333), () => {
    console.log('Servidor em produção...');
});
