import jwt from 'jsonwebtoken';
import { tokenSecret } from './tokenSecret.js';

function generateToken(userData){ 
  return jwt.sign({ 
    infoUser: {
      id_login: userData.id_user,
      email: userData.email,
      id_igreja: userData.id_igreja,
      auth_tag: userData.auth_tag
    } 
  }, tokenSecret(), { algorithm: 'HS256', expiresIn: 60 * 60 * 5 });
}

function generateRegistrationToken(id_igreja) {
  return jwt.sign({ purpose: 'initial-pastor', id_igreja }, tokenSecret(), { algorithm: 'HS256', expiresIn: '15m' });
}

function verifyRegistrationToken(token) {
  const claims = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] });
  if (claims.purpose !== 'initial-pastor' || !Number.isSafeInteger(Number(claims.id_igreja))) throw new Error('Token de cadastro inválido.');
  return Number(claims.id_igreja);
}

function getIdIgrejaFromToken(token) {
  try {
    const decoded = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] });
    return decoded.infoUser.id_igreja;
  } catch (error) {
    return null;
  }
}

export {generateToken, getIdIgrejaFromToken, generateRegistrationToken, verifyRegistrationToken};
