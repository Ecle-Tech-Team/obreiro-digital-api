# SECURITY_FIX_REPORT — FASE 2

Data: 06/10/2026. Base: `SECURITY_AUDIT.md`, `SECURITY_FINDINGS.json` e `AUDITORIA_OBREIRO_DIGITAL.md`, revalidados contra o código antes das alterações. Nenhuma correção abaixo depende apenas da interface para autorizar acesso. Nenhum valor de segredo é reproduzido aqui.

## Resultado

Foram corrigidos os caminhos de exploração confirmados de acesso público, alteração entre igrejas, senhas novas em claro, recuperação sem prova, movimentação por ID e inconsistência de novos lançamentos financeiros. Os testes automatizados e o banco isolado passaram. Permanecem tarefas de implantação e riscos explicitados abaixo; a FASE 2 não deve ser interpretada como autorização para publicar sem essas ações.

| Finding | Estado | Correção e verificação |
| --- | --- | --- |
| SEC-001 | Corrigido | JWT, papel de pastor e igreja conferidos em todas as rotas financeiras; testes A/B HTTP e unitários. |
| SEC-002 | Corrigido | Cadastro inicial exige token curto emitido após criar a própria igreja; só a primeira conta pode usá-lo; teste de cadastro indevido. |
| SEC-003 | Código corrigido; execução pendente | Senhas novas e alteradas usam `scrypt` com salt; login migra senha legada após autenticação. O script `src/scripts/migratePasswords.js` migra as demais com atualização condicionada. Testes unitário e HTTP/MySQL passaram; falta executar no banco existente. |
| SEC-004 | Código corrigido; rotação pendente | JWT usa `JWT_SECRET` do ambiente, tamanho mínimo e algoritmo explícito. Um segredo já divulgado deve ser trocado no ambiente de implantação. Testes de token e build Docker. |
| SEC-005 | Corrigido | Consultas de usuários projetam campos sem senha e `GET /cadastro` usa a identidade do JWT. Teste HTTP/MySQL. |
| SEC-006 | Corrigido | Alteração/exclusão requer dono real na igreja e papel apropriado; testes HTTP/MySQL A/B. |
| SEC-007 | Corrigido | Membros exigem igreja de origem nas mutações; testes HTTP/MySQL e gate A/B. |
| SEC-008 | Corrigido | Departamentos exigem igreja nos IDs e nas mutações; teste HTTP/MySQL. |
| SEC-009 | Corrigido | Visitantes e catálogo de membros exigem JWT e escopo da igreja; testes HTTP/MySQL e A/B. |
| SEC-010 | Corrigido | Estoque restringe listas, busca, edição e exclusão por igreja; testes do gate A/B. |
| SEC-011 | Corrigido | Pedidos têm dono verificado, atualização condicionada à igreja e resposta condicionada ao estado; testes do gate A/B e da transição. |
| SEC-012 | Corrigido | Eventos e avisos locais/globais usam escopo e papel no backend; testes A/B e publicação global. |
| SEC-013 | Acesso corrigido; fluxo administrativo pendente | Catálogos e hierarquia têm escopo; vínculo arbitrário com matriz foi bloqueado. O vínculo administrativo precisa de um fluxo autenticado próprio se for requisito de produto. Testes do gate. |
| SEC-014 | Corrigido | Movimento requer Pastor Matriz, hierarquia válida e `UPDATE` condicionado à origem dentro de transação; testes de permissão e rollback. |
| SEC-015 | Corrigido | Publicação global exige Pastor Matriz no servidor; teste de papel. |
| SEC-016 | Corrigido nos campos confirmados | Departamento de membro e convidador de visitante são conferidos contra a igreja do JWT; teste de referência alheia. |
| SEC-017 | Novas operações corrigidas; histórico pendente | Lançamento/edição e saldo gravados em transação com bloqueio; parâmetros e delta corrigidos. Igreja nova recebe saldo na mesma transação; migração `002` preenche saldos ausentes. Saldos históricos devem ser conciliados antes de uso financeiro. Testes unitários e HTTP/MySQL. |
| SEC-018 | Código corrigido; rotação pendente | SMTP usa variáveis de ambiente e validação TLS padrão. Credenciais expostas anteriormente devem ser trocadas no provedor. Teste de renderização do email e build Docker. |
| SEC-019 | Backend corrigido; entrega externa não testada | Recuperação emite token de 15 minutos vinculado ao hash atual e confirmação atômica de uso único. Teste de token; envio real SMTP depende de credenciais do ambiente. |
| SEC-020 | Parcial | Limitador por IP/rota cobre login, recuperação e outras rotas públicas; teste de 429. Memória e contadores não são compartilhados entre réplicas. |
| SEC-021 | Corrigido | CORS usa lista explícita `CORS_ORIGINS`; preflight permitido retornou 204 e origem alheia 403 sem `Access-Control-Allow-Origin`. |
| SEC-022 | Corrigido nos controladores montados | Respostas 500 deixam de incluir erros SQL/internos; teste HTTP com valor financeiro inválido. Logs de servidor continuam internos. |
| SEC-023 | Configuração corrigida; implantação pendente | MySQL lê ambiente e Compose usa usuário de aplicação. Validar privilégio mínimo da conta usada em produção. Build Docker passou. |
| SEC-024 | Parcial | Escritas antes não aguardadas foram corrigidas nos fluxos alterados, com liberação em `finally` nas transações e serviços críticos. Serviços legados ainda contêm liberações fora de `finally`; teste de integração cobre fluxos principais. |
| SEC-025 | Corrigido | Cada requisição verifica usuário, igreja e etiqueta derivada do hash atual; mudança de senha, exclusão ou transferência invalida o JWT antigo. Teste HTTP/MySQL de revogação. |
| SEC-026 | Parcial | O frontend deixou de guardar JWT em `sessionStorage` e usa cookie HttpOnly, SameSite=Lax, com CORS credenciado e verificação de Origin para escritas por cookie. O backend mantém Bearer para clientes existentes. Falta CSP completa e o token ainda consta na resposta de login para compatibilidade. Testes de cookie, logout e build. |
| SEC-027 | Corrigido | Conteúdo do suporte recebe escape HTML; teste com marcação hostil. |
| SEC-028 | Corrigido no ambiente fornecido | Dockerfile da API usa usuário não root e ignora `.env`; Compose limita MySQL ao loopback e mantém volume. Build da imagem passou. Revisar segredos e portas ao implantar. |
| SEC-029 | Arquivo corrigido; histórico pendente | Dados de exemplo e comando de apagar banco removidos de `script.sql`; histórico Git não é apagado por esta alteração. Credenciais de exemplo usadas fora de testes devem ser revogadas. Verificação estática. |
| SEC-030 | Corrigido | `mysql2`, Express, Nodemailer e `jws` atualizados; `nodemon` removido. `npm audit` do backend: zero alertas; testes e imagem Docker passaram. |
| SEC-031 | Parcial | Next.js e Axios atualizados e transitivas corrigidas sem mexer em CSS/classes; build passou. Audit completo do frontend: cinco alertas HIGH no conjunto Tailwind 3 / braces / chokidar / fast-glob / micromatch. `npm audit --omit=dev`: zero. A atualização para Tailwind 4 exige validação visual e foi deixada pendente para respeitar a restrição de estilo. |
| SEC-032 | Corrigido | Logs de email/ID removidos das páginas; `rg` sem `console.log` em `app`; build passou. |
| SEC-033 | Informativo | Placeholders preservados; testes A/B comprovam que isolamento adicional ocorre no gate e SQL. |
| SEC-034 | Corrigido | Edição de departamento aponta à rota de departamento; build passou e teste HTTP/MySQL de edição própria. |
| SEC-035 | Corrigido | Rotas legadas de perfil não são montadas; recuperação atual usa token e hash. Inspeção de `routes.js` e teste de recuperação. |

## Testes executados

- `npm test` no backend: 23 passaram, 1 integração ignorada por padrão, zero falhas.
- `SECURITY_INTEGRATION=1 node --test test/integration.test.js` em MySQL Docker isolado: 1 passou. Inclui Igreja A→A permitido, A→B negado, B→B permitido, B→A negado, acesso privado sem JWT negado, saldo e migração de saldo repetível, senha legada, pedidos, cookie/logout, exclusão de usuário e revogação de JWT.
- `npm run build` no frontend Next.js 15: passou, 28 páginas estáticas geradas. Nenhum arquivo CSS ou classe visual foi editado.
- `docker compose --project-name obreiro_security_test build api`: passou.
- `npm audit` backend: 0. Frontend completo: 5 HIGH; frontend `--omit=dev`: 0.
- Preflight CORS permitido e negado verificados contra a API local.
- `node --check` nos arquivos JS do backend e `git diff --check` foram executados; o último apontou apenas espaços em linhas modificadas, removidos depois da verificação.

## Antes da implantação

1. Trocar `JWT_SECRET` e credenciais SMTP previamente expostos, invalidando tokens antigos; configurar `CORS_ORIGINS` para o domínio real. Usar conta MySQL com privilégio mínimo.
2. Fazer backup e aplicar `001_nullable_report_owner.sql` e `002_backfill_missing_balances.sql` no banco existente, revisar duplicidades em `saldo` e conciliar saldos históricos com transações. O teste isolado não aplicou migrações no banco de produção.
3. Após backup, executar `node src/scripts/migratePasswords.js` com as variáveis do banco existente, conferir a contagem e redefinir contas com dados inválidos. Testar envio SMTP real.
4. Tratar os cinco alertas de ferramentas de build ao planejar migração visual de Tailwind 3 para 4. Se houver várias réplicas de API, trocar o limitador em memória por armazenamento compartilhado.
5. Projetar CSP compatível com os scripts e estilos atuais e avaliar a retirada do token na resposta de login do navegador para encerrar SEC-026. Validar cookies em HTTPS no domínio real.

Nenhum `npm audit fix` ou `npm audit fix --force` foi executado.
