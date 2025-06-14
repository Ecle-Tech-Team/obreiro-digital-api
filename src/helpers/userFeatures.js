import jwt from 'jsonwebtoken';

const secret = '1501222724';

function generateToken(userData){ 
  return jwt.sign({ 
    infoUser: {
      id_login: userData.id_user,
      email: userData.email,
      id_igreja: userData.id_igreja
    } 
  }, secret, { expiresIn: 60 * 60 * 5 });
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