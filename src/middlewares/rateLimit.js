export function createRateLimiter({ max, windowMs, now = Date.now, store }) {
  const attempts = new Map();
  return async (request, response, next) => {
    const time = now();
    const route = request.path.split('/').filter(Boolean)[0] || '/';
    const key = `${request.ip}:${route}`;
    let entry;
    try {
      if (store) {
        entry = await store(key, time, windowMs);
      } else {
        if (attempts.size > 10000) for (const [oldKey, value] of attempts) if (value.until <= time) attempts.delete(oldKey);
        const previous = attempts.get(key);
        entry = !previous || previous.until <= time ? { count: 0, until: time + windowMs } : previous;
        entry.count++;
        attempts.set(key, entry);
      }
    } catch (error) { return next(error); }
    if (entry.count > max) return response.status(429).set('Retry-After', String(Math.ceil((entry.until - time) / 1000))).json({ message: 'Muitas tentativas. Tente novamente mais tarde.' });
    return next();
  };
}
