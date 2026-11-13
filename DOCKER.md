# Ambiente Docker local

Este Compose sobe a API Express e o MySQL. Para o sistema completo (com o frontend), use o `docker-compose.yml` da pasta que contém os dois repositórios.

## Pré-requisitos

- Docker Desktop com Docker Compose v2 ou superior
- Portas 3333 e 3307 livres no host (ou defina `API_PUBLISH_PORT` e `DB_PUBLISH_PORT` no `.env`)

## Primeira execução

No PowerShell, na pasta deste arquivo:

```powershell
Copy-Item .env.example .env
```

Troque `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` e `JWT_SECRET` por valores locais próprios no `.env`. Deixe `EMAIL_CONTATO` e `SENHA_CONTATO` vazios se não for testar email. Então execute:

```powershell
docker compose build
docker compose up -d
```

Em Bash, a cópia é `cp .env.example .env`.

## Operação

```powershell
docker compose ps
docker compose logs -f api
docker compose logs -f db
docker compose restart
docker compose down
docker compose up -d --build api
docker compose exec api npm run migrate            # migrations pendentes
docker compose exec api npm run migrate -- --dry-run   # só listar
```

`docker compose down` preserva o volume `mysql_data`. **`docker compose down -v` remove o volume e todos os dados do banco.**

Os serviços usam `restart: unless-stopped`, e a imagem da API tem healthcheck em `/health` (testa também o banco).

## Banco

O MySQL 8.4 fica disponível no host em `localhost:3307` para DBeaver, Workbench ou CLI; a API dentro do Compose usa `db:3306`. O banco padrão é `obreiro_digital`, com usuário `obreiro`. A senha está apenas no `.env` local.

O arquivo `docker/mysql/init.sql` foi derivado das definições de tabelas em `src/repository/script.sql`. O `DROP DATABASE` e os dados de demonstração, inclusive usuários, foram excluídos. O MySQL executa o init apenas ao criar um volume vazio. Alterações futuras no SQL não modificam volumes já inicializados. O banco inicia sem contas da aplicação; o cadastro deverá ser feito pelo fluxo normal da API. Para bancos existentes, use `npm run migrate`, que aplica `src/repository/migrations/` e registra o que rodou em `schema_migrations`.

## Execução direta da API

Para rodar a API fora do Docker, use as variáveis do `.env` neste diretório, ajustando `DB_HOST=localhost` e `DB_PORT=3307` caso use o MySQL do Compose. `npm start` e o container executam `node src/index.js`.
