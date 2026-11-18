# Rodar localmente com dados de teste

O sistema roda igual à produção (`deploy/compose.yaml`): banco, API, site e nginx em containers, em `http://localhost:8080`. Um seed preenche todas as telas com dados de demonstração.

Pré-requisitos: Docker Desktop e os dois repositórios lado a lado na mesma pasta:

```
ObreiroDigital/
├─ obreiro-digital-api/
└─ Obreiro-Digital/
```

## 1. Configurar (uma vez)

```powershell
cd obreiro-digital-api\deploy
Copy-Item .env.example .env
```

No `deploy\.env`:

- `APP_URL=` e `COMPOSE_PROFILES=` vazios (sem túnel).
- `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD` e `JWT_SECRET`: qualquer texto longo. Para gerar um:

  ```powershell
  -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
  ```

- Porta 8080 ocupada? Troque `LAN_PORT`.

## 2. Subir e preencher

```powershell
docker compose up -d --build
docker compose run --rm -e ALLOW_DEMO_SEED=1 api node src/scripts/seed.js
```

Abra `http://localhost:8080`. Todos os usuários usam a senha `obreiro-demo-123`:

| Cargo | Email | Igreja |
| --- | --- | --- |
| Pastor Matriz | `pastor.matriz@demo.invalid` | Igreja Esperança — Sede |
| Obreiro Matriz | `obreiro.matriz@demo.invalid` | Igreja Esperança — Sede |
| Pastor | `pastor.filial@demo.invalid` | Congregação Vila Nova |
| Obreiro | `obreiro.filial@demo.invalid` | Congregação Vila Nova |

O seed cria uma matriz com duas filiais (a Monte Sião fica sem pastor, para testar o convite), membros com aniversariantes no mês, visitantes, eventos próximos e passados, avisos locais e da matriz, lançamentos financeiros com saldo calculado, estoque com produto vencido e pedidos pendentes, entregues e recusados. As datas são relativas ao dia em que ele roda.

Os pastores entram no painel. Os obreiros vão para o app do obreiro: abra no celular ou use o modo celular do navegador (F12 › ícone de celular).

O seed só roda com `ALLOW_DEMO_SEED=1` e num banco sem igrejas. Ele cria usuários com senha conhecida: **nunca rode em produção**.

## 3. Zerar os dados

```powershell
docker compose down -v
docker compose up -d
docker compose run --rm -e ALLOW_DEMO_SEED=1 api node src/scripts/seed.js
```

`down -v` apaga o banco local. Sem o `-v`, os dados ficam guardados entre um `up` e outro.

## 4. Desenvolver

**Frontend com recarga automática.** Deixe os containers rodando e, no `deploy\.env`, libere a origem do servidor de desenvolvimento:

```
CORS_ORIGINS=http://localhost:3000
```

```powershell
docker compose up -d api        # aplica a mudança no .env
cd ..\..\Obreiro-Digital
Set-Content .env.local "NEXT_PUBLIC_API_URL=http://localhost:8080/api"
npm install
npm run dev
```

Abra `http://localhost:3000`. As alterações no código aparecem na hora.

**API.** Depois de mudar o código, recrie o container. Os testes rodam fora do Docker:

```powershell
docker compose up -d --build api
cd ..
npm test
```

**Ver o banco** (DBeaver, Workbench): o MySQL não fica exposto. Para uma consulta rápida:

```powershell
docker compose exec db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

## Comandos úteis

```powershell
docker compose ps                    # estado dos containers
docker compose logs -f api           # logs da API
docker compose down                  # para tudo (mantém os dados)
docker compose up -d --build         # depois de git pull
```
