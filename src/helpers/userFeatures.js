import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function generateToken(id_login, email){
  const secret = crypto.randomBytes(32).toString('hex');

  console.log (secret);

  return jwt.sign({infoUser: {id_login, email}}, secret, {expiresIn: 60 /*segundos*/ * 60 /*minutos*/ * 5 /*horas*/});
}

export {generateToken};