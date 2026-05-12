# Dashboard Rafael

Aplicacao web para gestao financeira pessoal com autenticacao Supabase, perfil de usuario e upload de avatar em Storage.

## Status atual

- Backend principal em Supabase (Auth, Postgres, Storage, RLS).
- Gestao de perfil com nome, tema e avatar.
- Avatar com upload em bucket `avatars`, politicas RLS e remocao persistente.
- Tema do app configuravel pelo usuario e aplicado em tempo real.
- Modulos ativos no dashboard: visao geral, cartoes e faturas.
- Base mensal de transacoes em andamento no store:
  - carregamento por competencia (`competence_month` e `competence_year`)
  - geracao automatica de recorrentes por mes com idempotencia

## Stack

- React 18
- Vite 5
- Tailwind CSS
- Zustand
- Supabase JS v2
- Recharts

## Requisitos

- Node.js 18+
- npm 9+
- Projeto Supabase ativo

## Variaveis de ambiente

Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

## Instalação

```bash
npm install
```

## Execucao local

```bash
npm run dev
```

## Build de producao

```bash
npm run build
npm run preview
```

## Scripts

- `npm run dev`: inicia ambiente de desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run preview`: sobe preview local da build.
- `npm run lint`: executa lint.
- `npm run lint:fix`: corrige lint automaticamente.

## Estrutura principal

```text
src/
  components/
    Dashboard.jsx
    Settings.jsx
    Sidebar.jsx
    CreditCardsManager.jsx
    InvoicesPanel.jsx
  lib/
    supabaseClient.js
  storeSupabase.js
  App.jsx
docs/
  00-visao-geral.md
  01-arquitetura-tecnica.md
  02-banco-e-rls.md
  03-storage-avatar.md
  04-processos-operacionais.md
  05-runbook-debug.md
  06-changelog-operacional.md
```

## Fluxo de perfil e avatar

1. Usuario autenticado abre configuracoes.
2. Alteracoes de nome/tema/avatar sao enviadas para Supabase.
3. O store global (`storeSupabase`) atualiza `userProfile`.
4. O dashboard renderiza os dados reativos do store sem refresh manual.

## Fluxo mensal de receitas e despesas (em evolucao)

1. O store carrega transacoes por periodo via `loadTransactionsByPeriod(userId, month, year)`.
2. O store garante recorrentes do mes com `ensureMonthlyRecurringTransactions(userId, month, year)`.
3. A geracao mensal evita duplicacao usando `recurring_source_id` + competencia.
4. Regra de negocio: dia recorrente invalido no mes e ajustado para ultimo dia do mes.

## Documentacao completa

Toda documentacao tecnica e operacional esta em `docs/`.

## Arquivos legais

- `TERMOS_SERVICO.md`
- `POLITICA_PRIVACIDADE.md`

## Notas importantes

- Bucket de avatar padrao: `avatars`.
- Politicas RLS de Storage devem usar `storage.foldername(name)[1] = auth.uid()::text` para validar pasta do usuario.
- Em atualizacao de avatar, usar nome de arquivo unico para evitar problema de cache.
