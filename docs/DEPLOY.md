# Obreiro Digital em produção numa máquina só (TrueNAS SCALE + Docker)

Banco, API, site, nginx, túnel da Cloudflare e backup rodam em containers num único `docker compose` (`deploy/compose.yaml`).

```
Internet ──HTTPS──▶ Cloudflare ──túnel──▶ cloudflared ──▶ nginx :80 ─┬─ /      ──▶ frontend :3000
Rede local ──http://truenas:8080─────────────────────────▶ nginx     └─ /api/  ──▶ api :3333 ──▶ db (MySQL)
                                                     backup (03:30) ──mysqldump──▶ deploy/backups
```

Nenhuma porta do roteador precisa ser aberta. Só o nginx publica uma porta (8080), e apenas na rede local. Site e API ficam no mesmo endereço (`/` e `/api`), então o mesmo build funciona pelo IP, pelo nome do servidor e pelo domínio.

| Serviço | O que faz | Dados persistentes |
| --- | --- | --- |
| `db` | MySQL 8.4. No primeiro start cria o schema completo (`docker/mysql/init.sql`) | volume `obreiro_db-data` |
| `api` | API Express; só o nginx a alcança | — |
| `frontend` | Site Next.js | — |
| `nginx` | Entrada única: rede local e origem do túnel; cabeçalhos de segurança | — |
| `cloudflared` | Endereço público HTTPS (perfil `public`) | — |
| `backup` | Todo dia às 03:30, dump do banco em `deploy/backups/` | `deploy/backups/` |

---

## 1. TrueNAS SCALE

O TrueNAS SCALE 24.10 ou mais novo já traz Docker e Compose (Apps › Configuration › escolha o pool). O Obreiro roda como um projeto Compose comum, fora do catálogo de Apps, e volta sozinho depois de reiniciar (`restart: unless-stopped`). Os comandos `docker` precisam de `sudo` no TrueNAS.

Pelo Shell do TrueNAS (System › Shell) ou por SSH:

```bash
# uma vez: dataset próprio (aparece em Datasets) e os dois repositórios lado a lado
sudo midclt call pool.dataset.create '{"name": "tank/obreiro", "share_type": "GENERIC"}'
sudo chown "$USER" /mnt/tank/obreiro
cd /mnt/tank/obreiro
git clone https://github.com/Ecle-Tech-Team/obreiro-digital-api.git
git clone https://github.com/Ecle-Tech-Team/Obreiro-Digital.git
```

Troque `tank` pelo nome do seu pool. Os dois repositórios **precisam ficar na mesma pasta**: o compose do repositório da API constrói o site a partir de `../../Obreiro-Digital`.

Repositório privado: o `git clone` pede usuário e senha. Use seu usuário do GitHub e, como senha, um token (GitHub › Settings › Developer settings › Personal access tokens, com leitura dos dois repositórios).

## 2. Configurar

```bash
cd /mnt/tank/obreiro/obreiro-digital-api/deploy
cp .env.example .env
chmod 600 .env
openssl rand -hex 32    # rode uma vez para cada segredo
```

Preencha o `deploy/.env` (cada item está comentado no arquivo):

- `DB_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `JWT_SECRET`: um valor novo do `openssl` para cada.
- `APP_URL`: o endereço público (ex.: `https://obreiro.seudominio.com.br`). Para usar só na rede local, deixe vazio e `COMPOSE_PROFILES=` vazio.
- Email, para a recuperação de senha chegar: `EMAIL_CONTATO` e uma **senha de app** do Google em `SENHA_CONTATO` (Conta Google › Segurança › Verificação em duas etapas › Senhas de app). A senha normal da conta não funciona. Outro provedor: preencha `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASSWORD`.

Com pouca memória, os limites `DB_MEM_LIMIT`, `API_MEM_LIMIT` e `FRONTEND_MEM_LIMIT` evitam disputar RAM com o ZFS. Os padrões somam cerca de 1,5 GB.

## 3. Cloudflare Tunnel (endereço público)

Pré-requisito: um domínio gerenciado pela Cloudflare (plano gratuito).

1. Cloudflare › **Zero Trust** › Networks › **Tunnels** › Create a tunnel › *Cloudflared*.
2. Dê um nome (ex.: `obreiro`) e copie o **token** do comando de instalação (o texto longo depois de `--token`). Cole em `TUNNEL_TOKEN` no `.env`. Não instale nada no TrueNAS: o container `cloudflared` faz isso.
3. Em **Public Hostname**: subdomínio `obreiro`, seu domínio, Service **HTTP** e URL **`nginx:80`**.
4. Use o mesmo endereço em `APP_URL` e deixe `COMPOSE_PROFILES=public`.

Pelo túnel o acesso é HTTPS e o cookie de sessão vai com `Secure`. Na rede local (`http://truenas:8080`) vai sem, porque é HTTP. Isso é automático (`COOKIE_SECURE=auto`).

## 4. Subir

```bash
cd /mnt/tank/obreiro/obreiro-digital-api/deploy
sudo docker compose up -d --build
sudo docker compose ps
curl -fsS http://localhost:8080/api/health    # {"status":"ok"}
```

O primeiro build leva alguns minutos. Depois, abra `http://<ip-do-truenas>:8080` (ou o `APP_URL`), clique em **Cadastre sua igreja** e crie a igreja e o pastor. O banco começa vazio.

## 5. Backups

Todo dia às 03:30 (`BACKUP_AT`), `deploy/backups/obreiro-AAAA-MM-DD-HHMM.sql.gz`, guardando os últimos `BACKUP_KEEP_DAYS` dias.

```bash
sudo docker compose exec backup bash /backup/backup.sh   # testar agora
ls -lh backups/
```

Como a pasta fica no dataset `tank/obreiro`, ela entra nos snapshots do TrueNAS (Data Protection › Periodic Snapshot Tasks) e pode ir para outro disco ou para a nuvem (Cloud Sync Tasks). Um backup que só existe no servidor some junto com ele.

Restaurar, com cuidado: sobrescreve os dados atuais.

```bash
gunzip -c backups/obreiro-AAAA-MM-DD-HHMM.sql.gz \
  | sudo docker compose exec -T db sh -c 'mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"'
```

## 6. Atualizar

```bash
cd /mnt/tank/obreiro
git -C obreiro-digital-api pull
git -C Obreiro-Digital pull
cd obreiro-digital-api/deploy
sudo docker compose exec backup bash /backup/backup.sh             # backup antes
sudo docker compose up -d --build db api                           # API nova
sudo docker compose run --rm api node src/scripts/migrate.js       # migrations novas, se houver
sudo docker compose up -d --build
sudo docker image prune -f
```

O `migrate.js` só aplica o que falta (`Nenhuma migration pendente.` quando não há nada).

## Problemas comuns

| Sintoma | O que ver |
| --- | --- |
| Página não abre pelo domínio | `sudo docker compose logs cloudflared`; no painel do túnel, o Public Hostname precisa apontar para `http://nginx:80` |
| Erro 1033 / "failed to dial … quic" | A rede bloqueia QUIC. O compose já usa HTTP/2 (`TUNNEL_TRANSPORT_PROTOCOL=http2`) |
| Login volta para a tela de login | Acesso por HTTPS sem passar pelo túnel (outro proxy)? Esse proxy precisa enviar `X-Forwarded-Proto: https` ao nginx |
| "Origem não permitida" | O site foi aberto num endereço e chama a API em outro. Use sempre o mesmo endereço; origens extras vão em `CORS_ORIGINS` no compose |
| Código de recuperação não chega | `sudo docker compose logs api \| grep -i email`. Gmail exige senha de app em `SENHA_CONTATO` |
| `db` não fica saudável | `sudo docker compose logs db`. Senhas do `.env` trocadas depois do primeiro start não valem: o MySQL guarda as do primeiro start |
| Pouca memória | Reduza `DB_BUFFER_POOL` e os `*_MEM_LIMIT` no `.env` e rode `sudo docker compose up -d` |
