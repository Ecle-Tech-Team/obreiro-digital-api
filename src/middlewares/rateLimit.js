export function createRateLimiter({ max, windowMs, now = Date.now }) {
  const attempts = new Map();
  return (request, response, next) => {
    const time = now();
    if (attempts.size > 10000) for (const [key, value] of attempts) if (value.until <= time) attempts.delete(key);
    const key = `${request.ip}:${request.path}`;
    const previous = attempts.get(key);
    const entry = !previous || previous.until <= time ? { count: 0, until: time + windowMs } : previous;
    entry.count++;
    attempts.set(key, entry);
    if (entry.count > max) return response.status(429).set('Retry-After', String(Math.ceil((entry.until - time) / 1000))).json({ message: 'Muitas tentativas. Tente novamente mais tarde.' });
    return next();
  };
}
