// Toda igreja precisa manter pelo menos um pastor: sem ele ninguém consegue
// administrar usuários, finanças ou recuperar o controle da igreja.
export const PASTOR_ROLES = Object.freeze(['Pastor', 'Pastor Matriz']);
export const isPastorRole = cargo => PASTOR_ROLES.includes(cargo);

export class LastPastorError extends Error {
  constructor() {
    super('A igreja precisa ter pelo menos um pastor. Defina outro pastor antes de remover, rebaixar ou mover este usuário.');
  }
}

// Deve ser chamado dentro de uma transação. Trava os pastores da igreja para que
// duas operações simultâneas não removam os dois últimos pastores ao mesmo tempo.
export async function assertAnotherPastor(conn, id_igreja, id_user) {
  const [rows] = await conn.query(
    'SELECT id_user FROM user WHERE id_igreja = ? AND cargo IN (?) AND id_user <> ? FOR UPDATE',
    [id_igreja, PASTOR_ROLES, id_user]);
  if (rows.length === 0) throw new LastPastorError();
}
