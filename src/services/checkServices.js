import banco from '../repository/connection.js'

async function checkEmail(email){

  const sql = 'SELECT email FROM employee WHERE email = ?';

  const conn = await banco.connect();
  const [rows] = await conn.query(sql, email);
  conn.end();
  
  return rows;
}

async function checkCode(email, codigo){
  const sql = "SELECT * FROM tbl_usuario WHERE email = ? and senha = ?";
  const conn = await banco.connect();
  const [rows] = await conn.query(sql, email, codigo);

  conn.end();
  return rows;
} 

async function changePassword(email, newPassword){

  const sql = "UPDATE employee SET password_employee = ? WHERE email = ?";

  const dataNewPass = [newPassword, email];

  const conn = await banco.connect();
  await conn.query(sql, dataNewPass);
  conn.end();

  return;
}

// export async function checkName(userName) {
//   const sql = "SELECT * FROM tbl_usuario WHERE nome_usuario = ?";
//   const dados = [name_user] 
//   const conn = await banco.connect();
//   const [rows] = await conn.query(sql, dados);
  
//   conn.end();
//   return rows;
// }

export default {checkEmail, changePassword, checkCode}