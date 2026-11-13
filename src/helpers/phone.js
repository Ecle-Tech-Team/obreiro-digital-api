// Telefones são guardados só com dígitos: DDD + número (10 ou 11 dígitos),
// opcionalmente com código do país 55 (12 ou 13 dígitos).
export class PhoneValidationError extends Error {}

export function normalizePhone(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const digits = String(value).replace(/\D/g, '');
  if (!/^(?:55)?\d{10,11}$/.test(digits)) {
    throw new PhoneValidationError('Celular inválido. Use DDD + número, por exemplo (11) 98765-4321.');
  }
  return digits;
}
