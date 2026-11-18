// Dados de demonstração para rodar o sistema localmente: uma matriz com duas filiais, um usuário
// por cargo e conteúdo em todas as telas. As datas são relativas a hoje.
//
//   docker compose run --rm -e ALLOW_DEMO_SEED=1 api node src/scripts/seed.js
//
// Só roda com ALLOW_DEMO_SEED=1 e num banco sem igrejas: nunca use em produção.
import mysql2 from 'mysql2/promise';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { hashPassword } from '../helpers/password.js';

export const DEMO_PASSWORD = 'obreiro-demo-123';
export const DEMO_USERS = [
  { email: 'pastor.matriz@demo.invalid', nome: 'Daniel Moreira', cargo: 'Pastor Matriz', igreja: 'matriz' },
  { email: 'obreiro.matriz@demo.invalid', nome: 'Ana Ribeiro', cargo: 'Obreiro Matriz', igreja: 'matriz' },
  { email: 'pastor.filial@demo.invalid', nome: 'Samuel Araújo', cargo: 'Pastor', igreja: 'vilaNova' },
  { email: 'obreiro.filial@demo.invalid', nome: 'Paulo Mendes', cargo: 'Obreiro', igreja: 'vilaNova' },
];

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Data a "dias" de hoje (negativo = passado).
const day = dias => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + dias); return iso(d); };
// Nascimento com dia e mês relativos a hoje: aparece como aniversário do mês quando "dias" é pequeno.
const birth = (anos, dias = 0) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + dias); d.setFullYear(d.getFullYear() - anos); return iso(d); };

export async function seed(db, { log = console.log } = {}) {
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM igreja');
  if (total > 0) throw new Error('O banco já tem igrejas. O seed só roda num banco vazio (docker compose down -v apaga o banco local).');

  await db.beginTransaction();
  try {
    const igreja = async (nome, setor, id_matriz, extra) => {
      const [r] = await db.query(
        'INSERT INTO igreja (nome,cnpj,data_fundacao,setor,ministerio,cep,endereco,bairro,cidade,id_matriz) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [nome, extra.cnpj, extra.fundacao, setor, 'Ministério Esperança', extra.cep, extra.endereco, extra.bairro, 'São Paulo', id_matriz]);
      await db.query('INSERT INTO saldo (saldo_atual,data_atualizacao,id_igreja) VALUES (0,CURDATE(),?)', [r.insertId]);
      return r.insertId;
    };
    const ids = {};
    ids.matriz = await igreja('Igreja Esperança — Sede', '01', null, { cnpj: '12.345.678/0001-90', fundacao: '1998-03-15', cep: '01001000', endereco: 'Praça da Sé, 100', bairro: 'Sé' });
    ids.vilaNova = await igreja('Congregação Vila Nova', '02', ids.matriz, { cnpj: '12.345.678/0002-71', fundacao: '2009-04-18', cep: '04800000', endereco: 'Rua das Oliveiras, 120', bairro: 'Jardim Esperança' });
    // Filial sem pastor: serve para testar o convite (Igrejas > filial > Convidar pastor).
    ids.monteSiao = await igreja('Congregação Monte Sião', '03', ids.matriz, { cnpj: '12.345.678/0003-52', fundacao: '2015-08-02', cep: '02010000', endereco: 'Av. Monte Sião, 45', bairro: 'Santana' });

    const senha = await hashPassword(DEMO_PASSWORD);
    let cod = 1;
    for (const u of DEMO_USERS) {
      await db.query('INSERT INTO user (cod_membro,nome,email,senha,birth,cargo,id_igreja) VALUES (?,?,?,?,?,?,?)',
        [`U-${pad(cod++)}`, u.nome, u.email, senha, birth(40), u.cargo, ids[u.igreja]]);
    }

    const deps = {};
    for (const [nome, igr, congresso] of [['Jovens', 'matriz', 45], ['Louvor', 'matriz', null], ['Infantil', 'matriz', null], ['Senhoras', 'matriz', 80], ['Jovens', 'vilaNova', 60]]) {
      const [r] = await db.query('INSERT INTO departamentos (nome,birth,data_congresso,id_igreja) VALUES (?,?,?,?)',
        [nome, '2005-01-10', congresso ? day(congresso) : null, ids[igr]]);
      deps[`${igr}.${nome}`] = r.insertId;
    }

    const membros = [
      ['Lucas Almeida', 'matriz.Jovens', 22, 3, 'Não'], ['Beatriz Costa', 'matriz.Jovens', 19, 10, 'Sim'],
      ['Gabriel Souza', 'matriz.Jovens', 24, -40, 'Não'], ['Mariana Lima', 'matriz.Louvor', 31, 1, 'Não'],
      ['Rafael Pereira', 'matriz.Louvor', 35, -120, 'Não'], ['Juliana Rocha', 'matriz.Infantil', 28, 60, 'Não'],
      ['Carlos Nogueira', null, 52, -15, 'Não'], ['Helena Martins', 'matriz.Senhoras', 61, 5, 'Não'],
      ['Teresa Gomes', 'matriz.Senhoras', 58, 200, 'Não'], ['Pedro Henrique Dias', 'matriz.Jovens', 17, -2, 'Sim'],
      ['Fernanda Alves', 'matriz.Louvor', 27, 150, 'Sim'], ['José Barbosa', null, 70, 90, 'Não'],
      ['Ricardo Teixeira', 'vilaNova.Jovens', 21, 7, 'Sim'], ['Camila Freitas', 'vilaNova.Jovens', 23, -30, 'Não'],
      ['Antônio Pires', null, 48, 12, 'Não'], ['Luciana Prado', null, 39, -200, 'Não'],
    ];
    let m = 1;
    for (const [nome, dep, anos, dias, novo] of membros) {
      const igr = dep ? dep.split('.')[0] : (m > 14 ? 'vilaNova' : 'matriz');
      await db.query('INSERT INTO membro (cod_membro,nome,numero,birth,novo_convertido,id_departamento,id_igreja) VALUES (?,?,?,?,?,?,?)',
        [`M-${String(m).padStart(4, '0')}`, nome, `119${String(87650000 + m * 137).slice(0, 8)}`, birth(anos, dias), novo, dep ? deps[dep] : null, ids[igr]]);
      m += 1;
    }

    for (const [nome, cristao, dias, congregacao, igr] of [
      ['Roberta Silva', 'Não', -2, null, 'matriz'], ['Marcos Vinícius', 'Sim', -5, 'Assembleia de Deus Belém', 'matriz'],
      ['Sofia Andrade', 'Não', -9, null, 'matriz'], ['Eduardo Campos', 'Sim', -20, 'Igreja Batista Central', 'matriz'],
      ['Larissa Fontes', 'Não', -3, null, 'vilaNova'],
    ]) {
      await db.query('INSERT INTO visitante (nome,cristao,data_visita,congregacao,ministerio,id_igreja) VALUES (?,?,?,?,?,?)',
        [nome, cristao, day(dias), congregacao, congregacao ? 'Ministério convidado' : null, ids[igr]]);
    }

    for (const [nome, inicio, hi, fim, hf, local, igr, global] of [
      ['Culto de Jovens', 4, '19:30', 4, '21:30', 'Templo sede', 'matriz', false],
      ['Congresso de Jovens', 45, '19:00', 47, '22:00', 'Templo sede', 'matriz', true],
      ['Ensaio do Louvor', 2, '20:00', 2, '22:00', 'Sala de música', 'matriz', false],
      ['Santa Ceia', 0, '18:00', 0, '20:00', 'Templo sede', 'matriz', true],
      ['Retiro de Carnaval', -60, '08:00', -57, '17:00', 'Chácara Bom Pastor', 'matriz', true],
      ['Vigília', 10, '22:00', 11, '05:00', 'Congregação Vila Nova', 'vilaNova', false],
    ]) {
      await db.query('INSERT INTO eventos (nome,data_inicio,horario_inicio,data_fim,horario_fim,local,id_igreja,is_global,id_matriz) VALUES (?,?,?,?,?,?,?,?,?)',
        [nome, day(inicio), hi, day(fim), hf, local, ids[igr], global, global ? ids.matriz : null]);
    }

    for (const [titulo, conteudo, dias, igr, global] of [
      ['Campanha do agasalho', 'Traga roupas e cobertores em bom estado até o fim do mês. As doações vão para a comunidade do Jardim Esperança.', -1, 'matriz', true],
      ['Reunião de obreiros', 'Sábado às 15h, na sala 2. Pauta: escala do mês e preparação do congresso.', -3, 'matriz', false],
      ['Novo horário da escola bíblica', 'A partir deste domingo a EBD começa às 9h.', -8, 'matriz', true],
      ['Limpeza do templo', 'Precisamos de voluntários na sexta à noite.', -2, 'vilaNova', false],
    ]) {
      await db.query('INSERT INTO avisos (titulo,conteudo,data_criacao,id_igreja,is_global,id_matriz) VALUES (?,?,?,?,?,?)',
        [titulo, conteudo, `${day(dias)} 10:00:00`, ids[igr], global, global ? ids.matriz : null]);
    }

    const financas = [
      ['Entrada', 'Dízimo', '4850.00', 'Dízimos do mês', -2, 'matriz'],
      ['Entrada', 'Oferta Simples', '1230.50', 'Ofertas dos cultos de domingo', -5, 'matriz'],
      ['Entrada', 'Oferta Especial', '800.00', 'Oferta para o congresso', -12, 'matriz'],
      ['Saída', 'Contribuição para Obras', '2100.00', 'Reforma do telhado', -9, 'matriz'],
      ['Saída', 'Contribuição para Missões', '600.00', 'Missionários no Nordeste', -15, 'matriz'],
      ['Entrada', 'Dízimo', '4620.00', 'Dízimos do mês anterior', -33, 'matriz'],
      ['Entrada', 'Oferta Simples', '1105.00', 'Ofertas do mês anterior', -36, 'matriz'],
      ['Saída', 'Contribuição para Obras', '950.00', 'Pintura do salão', -40, 'matriz'],
      ['Entrada', 'Contribuição para Missões', '500.00', 'Campanha de missões', -62, 'matriz'],
      ['Entrada', 'Dízimo', '1320.00', 'Dízimos do mês', -4, 'vilaNova'],
      ['Saída', 'Contribuição para Obras', '300.00', 'Material elétrico', -6, 'vilaNova'],
    ];
    for (const [tipo, categoria, valor, descricao, dias, igr] of financas) {
      await db.query('INSERT INTO financas (tipo,categoria,valor,descricao,data,id_saldo,id_igreja) SELECT ?,?,?,?,?,id_saldo,id_igreja FROM saldo WHERE id_igreja = ?',
        [tipo, categoria, valor, descricao, day(dias), ids[igr]]);
    }
    // Saldo = entradas - saídas de cada igreja.
    await db.query(`UPDATE saldo s SET saldo_atual = (
        SELECT COALESCE(SUM(CASE WHEN f.tipo = 'Entrada' THEN f.valor ELSE -f.valor END), 0) FROM financas f WHERE f.id_igreja = s.id_igreja
      ), data_atualizacao = CURDATE()`);

    for (const [codigo, categoria, nome, qtd, validade, preco, igr] of [
      ['CZ-001', 'Cozinha', 'Café 500 g', 12, 120, '18.90', 'matriz'],
      ['CZ-002', 'Cozinha', 'Açúcar 5 kg', 4, 300, '24.50', 'matriz'],
      ['CZ-003', 'Cozinha', 'Leite integral 1 L', 20, -3, '5.49', 'matriz'],
      ['LP-001', 'Limpeza', 'Detergente 500 ml', 30, 40, '2.79', 'matriz'],
      ['LP-002', 'Limpeza', 'Água sanitária 2 L', 8, 365, '7.90', 'matriz'],
      ['MC-001', 'Materiais de Construção', 'Cimento 50 kg', 6, 180, '38.00', 'matriz'],
      ['LP-010', 'Limpeza', 'Sabão em pó 1 kg', 5, 200, '14.90', 'vilaNova'],
    ]) {
      await db.query('INSERT INTO estoque (cod_produto,categoria,nome_produto,quantidade,validade,preco_unitario,id_igreja) VALUES (?,?,?,?,?,?,?)',
        [codigo, categoria, nome, qtd, day(validade), preco, ids[igr]]);
    }

    for (const [nome, categoria, qtd, dias, status, entrega, motivo, igr] of [
      ['Cadeiras plásticas', 'Móvel', 20, -2, 'Em Andamento', null, null, 'vilaNova'],
      ['Detergente', 'Limpeza', 10, -1, 'Em Andamento', null, null, 'vilaNova'],
      ['Café 500 g', 'Cozinha', 6, -15, 'Entregue', -10, null, 'vilaNova'],
      ['Caixa de som', 'Equipamento', 1, -20, 'Recusado', null, 'A matriz vai emprestar a caixa reserva.', 'vilaNova'],
      ['Toalhas de papel', 'Limpeza', 12, -3, 'Em Andamento', null, null, 'monteSiao'],
      ['Microfone sem fio', 'Equipamento', 2, -4, 'Em Andamento', null, null, 'matriz'],
      ['Copos descartáveis', 'Cozinha', 10, -25, 'Entregue', -22, null, 'matriz'],
    ]) {
      await db.query('INSERT INTO pedidos (nome_produto,categoria_produto,quantidade,data_pedido,status_pedido,data_entrega,motivo_recusa,respondido,id_igreja) VALUES (?,?,?,?,?,?,?,?,?)',
        [nome, categoria, qtd, day(dias), status, entrega === null ? null : day(entrega), motivo, status !== 'Em Andamento', ids[igr]]);
    }

    await db.commit();
    log('Dados de demonstração criados.');
    log(`Senha de todos os usuários: ${DEMO_PASSWORD}`);
    for (const u of DEMO_USERS) log(`  ${u.cargo.padEnd(15)} ${u.email}`);
    return ids;
  } catch (error) {
    await db.rollback().catch(() => {});
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.ALLOW_DEMO_SEED !== '1') {
    console.error('Seed recusado: defina ALLOW_DEMO_SEED=1. Ele cria usuários com senha conhecida; nunca rode em produção.');
    process.exit(1);
  }
  for (const key of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) {
    if (!process.env[key]) throw new Error(`Configuração de banco ausente: ${key}`);
  }
  const db = await mysql2.createConnection({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  });
  try { await seed(db); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await db.end(); }
}
