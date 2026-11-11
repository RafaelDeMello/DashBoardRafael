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
npm run user:create         # cria seu usuário (a senha é pedida no terminal, oculta)
npm run dev                 # http://localhost:3000
```

A porta do banco (5435) foi escolhida porque 5432, 5433 e 5434 já estavam em uso.
Para mudar, ajuste `DB_PORT` e `DATABASE_URL` no `.env`.

## Segurança (regras do projeto)

- Senhas com argon2id; nunca em texto puro.
- Não há tela de cadastro: contas só são criadas por `npm run user:create`.
- Sessão por cookie `HttpOnly` + `SameSite=Lax` (`Secure` e prefixo `__Host-` em produção);
  o banco guarda só o SHA-256 do token.
- A checagem de sessão vive na camada de acesso a dados (`src/lib/dal.ts`), não só no proxy.
- `.env` nunca vai para o git.

## Documentação

- [Especificação do MVP](docs/especificacao.md)
- [Glossário](docs/glossario.md)
- [Decisões técnicas](docs/decisoes/)
