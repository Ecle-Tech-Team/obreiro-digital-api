import jwt from 'jsonwebtoken';
import { tokenSecret } from '../helpers/tokenSecret.js';

function verifyJWT(request, response, next) {
  const authHeader = request.headers.authorization;
  let token;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) return response.status(401).send({ message: 'Token inválido!' });
    token = parts[1];
  } else {
    const cookie = request.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith('od_session='));
    token = cookie?.slice('od_session='.length);
    if (!token) return response.status(401).send({ message: 'Token não informado!' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(value => value.trim());
      if (!request.headers.origin || !allowed.includes(request.headers.origin)) return response.status(403).send({ message: 'Origem não permitida.' });
    }
  }

  let decoded;
  try { decoded = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] }); }
  catch { return response.status(401).send({ message: 'Token inválido ou expirado!' }); }
  if (!decoded?.infoUser || !Number.isSafeInteger(Number(decoded.infoUser.id_login)) || !Number.isSafeInteger(Number(decoded.infoUser.id_igreja))) {
    return response.status(401).send({ message: 'Token inválido!' });
  }
    
    request.user = {
      id_user: decoded.infoUser.id_login,
      id_igreja: decoded.infoUser.id_igreja,
      email: decoded.infoUser.email,
      auth_tag: decoded.infoUser.auth_tag,
      session_version: decoded.infoUser.session_version,
      cargo: undefined
    };
    
    return next();
}

export default verifyJWT;
