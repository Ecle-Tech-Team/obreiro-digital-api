# Relatório de dockerização — Obreiro Digital

Data: 30/09/2026. O baseline do backend estava limpo (`git status`, `git diff --stat`, `git diff`). A consulta usou `git -c safe.directory=...` por diferença de proprietário no sandbox. O frontend não foi modificado. Como a pasta mãe não é um repositório Git, esta versão autocontida foi colocada no repositório da API para publicação no PR. O `.env` local está ignorado e `.env.example` está liberado.

## Arquitetura final

```text
Frontend Next.js no host (repositório irmão)
      | localhost:3333
      v
API Node/Express no container
      | db:3306
      v
MySQL 8.4 no container
      | /var/lib/mysql
      v
volume nomeado mysql_data
```

## Arquivos criados

- `docker-compose.yml`
- `.env.example`
- `.env` local, ignorado pelo Git
- `DOCKER.md`
- `docker/mysql/init.sql`
- `Dockerfile`
- `.dockerignore`
- `RELATORIO_DOCKER.md`

## Arquivos alterados

- `.gitignore`
- `src/index.js`
- `src/repository/connection.js`
- `src/helpers/userFeatures.js`
- `src/middlewares/jwt.js`
- `src/controllers/recoverLogin.js`

## Variáveis criadas

`API_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`, `EMAIL_CONTATO`, `SENHA_CONTATO`.

## Banco

- Imagem: `mysql:8.4` (executou MySQL 8.4.8).
- Porta interna: `3306`; porta host: `127.0.0.1:3307`.
- Volume: `obreiro-digital-api_mysql_data` montado em `/var/lib/mysql`.
- Healthcheck: consulta autenticada `SELECT 1` a cada 5 segundos.
- Init SQL: `docker/mysql/init.sql`, derivado das definições de tabelas de `src/repository/script.sql`. Não inclui `DROP DATABASE`, inserts, usuários de demonstração ou suas senhas. Executa somente no primeiro início de um volume vazio.
- Validação: 12 tabelas presentes, inclusive `igreja`, `user`, `membro` e `financas`.

## API

- Imagem Node: `node:24-alpine`, compatível com o Node 24 usado no ambiente e com o lockfile v3.
- Porta: `3333` no container e no host.
- Comando inicial: `node src/index.js`; instalação por `npm ci --omit=dev`.
- `DB_HOST`: `db` no Compose; `localhost` como padrão para execução direta no host.
- Script local `npm start` preservado (`nodemon`).
- JWT assinado e validado com a mesma `JWT_SECRET`; payload e duração permanecem iguais.
- Credenciais SMTP fixas do fluxo de recuperação foram substituídas por variáveis de ambiente. O serviço de email já usava essas variáveis.

## Testes

| Verificação | Resultado |
|---|---|
| `docker compose config --quiet` | PASS |
| `docker compose build` | PASS; `npm ci` passou |
| `docker compose up -d` | PASS |
| MySQL health | PASS |
| API iniciou | PASS; logs sem erro de módulo |
| API conectou ao MySQL | PASS; consulta `SHOW TABLES` via container da API |
| `GET http://localhost:3333/igreja` | PASS; HTTP 200, `[]` |
| CORS para frontend local | PASS; requisição com Origin `http://localhost:3000` recebeu `Access-Control-Allow-Origin: *` |
| `docker compose restart` | PASS; serviços recuperaram saúde |
| Persistência | PASS; `down` seguido de `up -d --wait` manteve as 12 tabelas |
| Frontend consegue acessar API | PASS para URL e CORS usados pelo cliente; interface Next.js não foi iniciada nesta verificação |

O build registrou avisos de vulnerabilidades de dependências existentes no lockfile; não houve atualização de dependências nesta tarefa. O `script.sql` original, que continua preservado e rastreado, ainda contém senhas de demonstração preexistentes; nenhuma delas foi copiada ao init. A credencial SMTP fixa removida do código deve ser rotacionada se ainda estiver ativa, pois permanece no histórico Git.
