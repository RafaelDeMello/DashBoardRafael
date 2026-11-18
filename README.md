# Only-Tasks

App de organização pessoal: rotinas diárias em listas marcáveis, com progresso por
dia, semana e mês, acessível pelo celular e pelo computador.

Projeto pessoal e de aprendizado. O código antigo (dashboard financeiro em React +
Supabase) está preservado na tag `legacy-dashboard-v1`.

## Stack

Next.js 16 · TypeScript · PostgreSQL 17 (Docker) · Drizzle ORM · argon2id

## Como rodar localmente

Requisitos: Node 22+, Docker.

```bash
npm install
cp .env.example .env        # depois troque POSTGRES_PASSWORD (e a mesma senha na DATABASE_URL)
docker compose up -d db     # Postgres em 127.0.0.1:5435
npm run db:migrate          # cria as tabelas
npm run user:create         # cria um usuário liberado (a senha é pedida no terminal, oculta)
npm run user:create -- --admin   # cria o ADMINISTRADOR (só vê o painel de acessos)
npm run dev                 # http://localhost:3000
```

A porta do banco (5435) foi escolhida porque 5432, 5433 e 5434 já estavam em uso.
Para mudar, ajuste `DB_PORT` e `DATABASE_URL` no `.env`.

## No celular (PWA) e publicação

O app pode ser **instalado** na tela inicial do celular ou do computador (manifesto e ícones
gerados por código, abre em tela cheia). Para usar no celular fora de casa, ele precisa estar
publicado na internet com HTTPS.

Publicação na VPS com Docker, HTTPS automático (Caddy) e backup diário do banco:
veja **[docs/deploy.md](docs/deploy.md)**. A stack de produção está em `docker-compose.prod.yml`.

## Testes

```bash
npm test             # roda todos os testes uma vez
npm run test:watch   # roda de novo a cada alteração
```

Precisam do banco no ar (`docker compose up -d db`). Eles usam um banco **separado**,
`onlytasks_test`, criado e migrado automaticamente no mesmo servidor: **nunca tocam nos
seus dados reais** (há travas que recusam rodar em qualquer banco que não termine em `_test`).

O que é coberto:

- **Autorização** (`tests/authz-days.test.ts`): um usuário não lê nem altera dados de outro,
  mesmo sabendo os ids (marcar, editar, remover, reordenar, copiar, apagar, modelo).
- **Ações do servidor** (`tests/actions-auth.test.ts`): sem sessão, nenhuma ação chega aos dados.
- **Login e sessão ponta a ponta** (`tests/auth-flow.test.ts`), com o código real (argon2,
  banco de teste, `session.ts`, `dal.ts`, `proxy.ts`) e só o armazenamento de cookies do
  Next simulado: cookie `HttpOnly`/`SameSite`/`Secure` em produção, banco guardando só o
  SHA-256 do token, mensagem genérica e tempo igual para e-mail inexistente, validação de
  entrada, limite de tentativas (por e-mail e por IP, com expiração), expiração e renovação
  da sessão, logout por aparelho e as duas camadas de proteção (proxy e `verifySession`).
- **Proxy**, **senhas (argon2id)**, **limite de tentativas** isolado, regras de **progresso e
  sequência** e de **datas**.

Os testes de segurança foram validados quebrando o código de propósito: em cada sabotagem
(tirar a checagem de dono, de sessão ou de validade, guardar o token puro, cookie sem
`HttpOnly`, desligar o limite de tentativas, logout que não apaga, entre outras) o teste
certo falhou.

Limite conhecido: não há teste de navegador. A interface continua sendo verificada à mão.

## Segurança (regras do projeto)

- Senhas com argon2id; nunca em texto puro.
- Cadastro aberto, mas a conta nasce **aguardando liberação** e não acessa nada até o administrador
  liberar (checado no servidor em `verifySession`, não só na tela). Limite de 5 cadastros por hora
  por IP e teto de 50 contas aguardando. O administrador só é criado por `npm run user:create -- --admin`
  e só vê o painel de acessos. Ver `docs/decisoes/0003-cadastro-com-liberacao.md`.
- Sessão por cookie `HttpOnly` + `SameSite=Lax` (`Secure` e prefixo `__Host-` em produção);
  o banco guarda só o SHA-256 do token.
- A checagem de sessão vive na camada de acesso a dados (`src/lib/dal.ts`), não só no proxy.
- Troca de senha exige a senha atual (máx. 5 erros por 15 min), encerra todas as sessões antigas e
  cria uma nova neste aparelho. Em Configurações dá para sair dos outros aparelhos ou de todos.
- Notas: a busca só olha arquivos do próprio usuário (nome, texto puro das notas e código), com o texto digitado escapado no LIKE; toda função de `src/lib/notes.ts` recebe o usuário da sessão; mover valida dono, repositório de destino, ciclos e profundidade;
  apagar repositório exige o nome exato (conferido no servidor); o conteúdo das notas é JSON validado, nunca HTML.
- `.env` nunca vai para o git.

## Documentação

- [Especificação do MVP](docs/especificacao.md)
- [Glossário](docs/glossario.md)
- [Decisões técnicas](docs/decisoes/)
- [O que falta fazer](docs/pendencias.md)
