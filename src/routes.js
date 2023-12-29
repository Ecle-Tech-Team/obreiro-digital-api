import express from 'express';
import login from './controllers/loginController.js';
import cadastro from './controllers/cadastroController.js';
import financas from './controllers/financasController.js'
import membro from './controllers/membrosController.js';
import departamento from './controllers/departamentosController.js';
import visitante from './controllers/visitantesController.js';
import estoque from './controllers/estoqueController.js';
import pedido from './controllers/pedidoController.js';
import evento from './controllers/eventoController.js';
import perfil from './controllers/perfilController.js';
import recSenha from './controllers/passwordController.js';

const route = express();

route.use ('/login', login);
route.use ('/cadastro', cadastro);
route.use ('/financas', financas)
route.use ('/membro', membro);
route.use ('/departamento', departamento);
route.use ('/visitante', visitante);
route.use ('/estoque', estoque);
route.use ('/evento', evento);
route.use ('/pedido', pedido);
route.use ('/perfil', perfil);
route.use ('/recuperarSenha', recSenha);

//http://localhost:3333/(routes)

export default route;