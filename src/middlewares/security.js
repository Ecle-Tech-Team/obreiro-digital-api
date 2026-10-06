const recordTables = Object.freeze({
  cadastro: ['user', 'id_user'], membro: ['membro', 'id_membro'],
  departamento: ['departamentos', 'id_departamento'], estoque: ['estoque', 'id_produto'],
  pedido: ['pedidos', 'id_pedido'], evento: ['eventos', 'id_evento'],
  avisos: ['avisos', 'id_aviso'], financas: ['financas', 'id_financas'],
});

const isId = value => /^(?:[1-9]\d*)$/.test(String(value ?? ''));
const pastor = user => user.cargo === 'Pastor' || user.cargo === 'Pastor Matriz';
const matriz = user => user.cargo === 'Pastor Matriz' || user.cargo === 'Obreiro Matriz';
import { verifyRegistrationToken } from '../helpers/userFeatures.js';

export function createSecurityGate(repository) {
  return async (request, response, next) => {
    try {
      const parts = request.path.split('/').filter(Boolean);
      const [module, first, second] = parts;
      if (!module || module === 'login' || module === 'cep' || module === 'recuperarLogin') return next();
      if (module === 'igreja' && request.method === 'POST' && !request.user) return next();
      if (module === 'cadastro' && request.method === 'POST' && !request.user) {
        let churchId;
        try { churchId = verifyRegistrationToken(request.body.registration_token); }
        catch { return response.status(401).json({ message: 'Cadastro inicial não autorizado.' }); }
        const church = await repository.getChurch(churchId);
        if (!church || church.id_matriz != null || Number(request.body.id_igreja) !== churchId || request.body.cargo !== 'Pastor Matriz') {
          return response.status(403).json({ message: 'Cadastro inicial não autorizado.' });
        }
        if (await repository.countUsers?.(churchId)) return response.status(403).json({ message: 'Cadastro inicial já realizado.' });
        request.bootstrapChurchId = churchId;
        return next();
      }
      if (!request.user?.id_user) return response.status(401).json({ message: 'Autenticação necessária.' });
      const user = await repository.getUser(request.user.id_user);
      if (!user || Number(user.id_igreja) !== Number(request.user.id_igreja) || (user.auth_tag && user.auth_tag !== request.user.auth_tag)) {
        return response.status(401).json({ message: 'Sessão inválida.' });
      }
      request.user = { ...request.user, ...user };
      const own = Number(user.id_igreja);
      const allowedChurch = async (id, allowBranch = false) => {
        if (!isId(id)) return false;
        if (Number(id) === own) return true;
        if (!allowBranch || !matriz(user)) return false;
        const church = await repository.getChurch(id);
        return church && Number(church.id_matriz) === own;
      };
      const deny = () => response.status(403).json({ message: 'Acesso negado.' });
      const sameChurch = async id => (await allowedChurch(id)) ? next() : deny();
      const record = async (table, id, allowBranch = false) => {
        if (!isId(id)) return deny();
        const owner = await repository.getOwner(table, id);
        return owner != null && await allowedChurch(owner, allowBranch) ? next() : deny();
      };
      if (module === 'financas') {
        if (!pastor(user)) return deny();
        if (request.method === 'POST') return sameChurch(request.body.id_igreja);
        if (first === 'saldo') return sameChurch(second);
        if (request.method === 'GET') return sameChurch(first);
        if (request.method === 'PUT') {
          if (!await allowedChurch(second) || !isId(first)) return deny();
          return record('financas', first);
        }
      }
      if (module === 'cadastro') {
        if (request.method === 'POST') {
          if (!pastor(user) || !await allowedChurch(request.body.id_igreja)) return deny();
          if (request.body.cargo?.includes('Matriz') && !matriz(user)) return deny();
          return next();
        }
        if (first === 'obreiros') return sameChurch(second);
        if (first === 'matriz') return await allowedChurch(second, true) ? next() : deny();
        if (request.method === 'GET' && parts.length === 1) return next();
        if (request.method === 'PUT' || request.method === 'DELETE') {
          if (!isId(first)) return deny();
          const target = await repository.getUser(first);
          if (!target || Number(target.id_igreja) !== own) return deny();
          if (request.method === 'DELETE' && Number(first) !== Number(user.id_user) && !pastor(user)) return deny();
          if (request.method === 'PUT' && request.body.id_igreja !== undefined) return deny();
          if (request.method === 'PUT' && request.body.cargo !== undefined && (!pastor(user) || (request.body.cargo.includes('Matriz') && !matriz(user)))) return deny();
          return next();
        }
      }
      if (module === 'mover') {
        if (!matriz(user) || !pastor(user)) return deny();
        const table = first === 'membro' ? 'membro' : first === 'cadastro' ? 'user' : null;
        const id = first === 'membro' ? request.body.id_membro : request.body.id_user;
        if (!table || !isId(id) || !await allowedChurch(request.body.nova_igreja_id, true)) return deny();
        return record(table, id, true);
      }
      if (module === 'visitante') {
        if (request.method === 'POST') {
          if (!await allowedChurch(request.body.id_igreja)) return deny();
          if (request.body.convidado_por && Number(await repository.getOwner('membro', request.body.convidado_por)) !== own) return deny();
          return next();
        }
        if (first === 'count') return sameChurch(second);
        if (first === 'membros' || first === 'igreja') return next();
        return sameChurch(first);
      }
      if (module === 'igreja') {
        if (request.method === 'GET' && parts.length === 1) return next();
        if (first === 'subordinadasUser') return Number(second) === Number(user.id_user) && matriz(user) ? next() : deny();
        if (first === 'subordinadas' || first === 'count') return Number(first === 'count' ? parts[3] : second) === own && matriz(user) ? next() : deny();
        if (request.method === 'PUT' && first === 'igreja') return deny(); // vínculo requer fluxo administrativo separado
        if (request.method === 'PUT' && !pastor(user)) return deny();
        if (request.method === 'GET') return await allowedChurch(first, true) ? next() : deny();
        return sameChurch(first);
      }
      if (module === 'perfil') return deny(); // endpoint legado sem identidade equivalente
      if (module === 'departamento' || module === 'membro' || module === 'estoque' || module === 'pedido' || module === 'evento' || module === 'avisos') {
        if (module === 'departamento' && request.method === 'GET' && parts.length === 1) return next();
        if ((module === 'evento' || module === 'avisos') && request.method === 'POST' && request.body.is_global && user.cargo !== 'Pastor Matriz') return deny();
        if ((module === 'evento' || module === 'avisos') && ['PUT', 'DELETE'].includes(request.method) && !pastor(user)) return deny();
        if (module === 'membro' && request.method === 'POST' && request.body.id_departamento && Number(await repository.getOwner('departamentos', request.body.id_departamento)) !== own) return deny();
        if (request.method === 'POST') return next();
        if (module === 'membro' && first === 'membro' && second === 'igreja') return next();
        if (first === 'igreja' && second && module === 'membro') return sameChurch(second);
        if (first === 'count') return sameChurch(parts.at(-1));
        if (first === 'semana') {
          if (!await allowedChurch(second)) return deny();
          const church = await repository.getChurch(second);
          const expectedMatrix = church?.id_matriz ?? church?.id_igreja;
          return Number(parts[3]) === Number(expectedMatrix) ? next() : deny();
        }
        if (first === 'matriz') return await allowedChurch(second, true) ? next() : deny();
        if (first === 'igreja' || first === 'departamentos' || first === 'search' || (module === 'pedido' && first === 'igreja')) return next();
        if (request.method === 'GET' && module === 'membro') return record('membro', first);
        if (request.method === 'GET') return sameChurch(first);
        if (request.method === 'PUT' && second && second !== 'responder') {
          if (!await allowedChurch(second)) return deny();
          if (module === 'membro' && request.body.id_departamento && Number(await repository.getOwner('departamentos', request.body.id_departamento)) !== own) return deny();
        }
        if (request.method === 'PUT' || request.method === 'DELETE') return record(recordTables[module][0], first);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export { recordTables };
