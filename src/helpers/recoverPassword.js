function generatePassword() {
  // Definindo uma string que contém todos os caracteres possíveis para a senha.
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]\:;?><,./-=';

  // Inicializando uma string vazia para a nova senha.
  let newPassword = '';

  // Loop para gerar uma senha de 16 caracteres.
  for (let i = 0; i < 16; i++) {
      // Gerando um número aleatório entre 0 e o comprimento da string 'characters'.
      const randomIndex = Math.floor(Math.random() * characters.length);

      // Adicionando o caractere correspondente à nova senha.
      newPassword += characters[randomIndex];
  }

  // Retornando a nova senha gerada.
  return newPassword;
}

// Exportando a função para que possa ser usada em outros arquivos.
export { generatePassword };
