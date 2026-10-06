import 'dotenv/config';

export function tokenSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET deve conter ao menos 32 caracteres.');
  return secret;
}
