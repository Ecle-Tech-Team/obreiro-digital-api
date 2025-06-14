import jwt from 'jsonwebtoken';

const secret = '1501222724';

function verifyJWT(request, response, next) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return response.status(401).send({ message: 'Token não informado!' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return response.status(401).send({ message: 'Token inválido!' });

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) return response.status(401).send({ message: 'Token inválido' });

  jwt.verify(token, secret, (err, decoded) => {
    if (err) return response.status(401).send({ message: 'Token inválido ou expirado!' });
    
    // Corrigido: Acesso direto às propriedades
    request.user = {
      id_user: decoded.infoUser.id_login,
      id_igreja: decoded.infoUser.id_igreja,
      email: decoded.infoUser.email
    };
    
    return next();
  });
}

export default verifyJWT; // Exporte como padrão