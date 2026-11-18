// Origens aceitas para requisições do navegador e regra do cookie de sessão.

export function allowedOrigins() {
  return (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(value => value.trim()).filter(Boolean);
}

// Site e API atrás do mesmo proxy (ex.: nginx com /api): a origem é o próprio endereço que
// recebeu a requisição. Vale para qualquer nome usado na rede (IP, nome do servidor, domínio).
// Requer "trust proxy" para que request.protocol reflita o X-Forwarded-Proto do proxy.
export function isSameOrigin(request, origin) {
  const host = request.get?.('host');
  return !!origin && !!host && origin === `${request.protocol}://${host}`;
}

export function originAllowed(request, origin) {
  return !!origin && (allowedOrigins().includes(origin) || isSameOrigin(request, origin));
}

// COOKIE_SECURE: "true", "false" ou "auto" (Secure só quando a requisição chegou por HTTPS,
// útil quando o mesmo servidor atende pela rede local em HTTP e por um túnel HTTPS).
// Sem a variável: Secure em produção.
export function cookieSecure(request) {
  const mode = String(process.env.COOKIE_SECURE || '').toLowerCase();
  if (mode === 'auto') return !!request.secure;
  if (mode === 'true') return true;
  if (mode === 'false') return false;
  return process.env.NODE_ENV === 'production';
}
