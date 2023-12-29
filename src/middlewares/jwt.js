import jwt from 'jsonwebtoken';

function verifyJWT(request, response, next){
  const secret = '1501222724';

  const authHeader = request.header.authorization;
  if(!authHeader) return response.status(401).send({message: 'Token não informado!'});

  const parts = authHeader.split(' ');
  if(parts.lenght !== 2) return response.status(401).send({message: 'Token inválido!'});

  const [scheme, token] = parts;
  if(!/^Bearer$/i.test(scheme)) return response.status(401).send({message: 'Token inválido'});

  jwt.verify(token, secret, (err, decoded) => {
    if(err){
      return response.status(401).send({message: 'Usuário não altenticado!'});
    }
    request.infoUser = decoded.infoUser;
    return next();
  });
}

export {verifyJWT};