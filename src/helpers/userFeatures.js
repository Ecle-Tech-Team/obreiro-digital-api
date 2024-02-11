import jwt from 'jsonwebtoken';

const secret = '1501222724';

function generateToken(id_login, email, id_igreja){ 
  return jwt.sign({ infoUser: { id_login, email, id_igreja } }, secret, {expiresIn: 60 * 60 * 5});
}

function getIdIgrejaFromToken(token) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded.infoUser.id_igreja;
  } catch (error) {
    
    return null;
  }
}

export {generateToken, getIdIgrejaFromToken};