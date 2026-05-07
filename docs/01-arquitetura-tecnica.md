# Arquitetura tecnica

## Camadas

1. Interface (React)
2. Estado global (Zustand)
3. Integracao de dados (Supabase client)
4. Persistencia e seguranca (Postgres + RLS + Storage)

## Componentes chave

- `src/App.jsx`
  - Inicializa sessao e fluxo de auth.
  - Envia dados base para o dashboard.
- `src/components/Dashboard.jsx`
  - Orquestra tabs e carrega dados iniciais.
  - Le dados do `userProfile` de forma reativa.
- `src/components/Settings.jsx`
  - Atualiza nome, tema e avatar.
  - Aciona funcoes de upload/remocao no store.
- `src/components/Sidebar.jsx`
  - Exibe avatar, nome e email do usuario.

## Estado global

Arquivo principal: `src/storeSupabase.js`.

Responsabilidades:

- Sessao e perfil (`user`, `userProfile`).
- CRUD de cartoes e faturas.
- Carregamento de transacoes e categorias.
- Upload/remocao de avatar.

## Integracao Supabase

Arquivo principal: `src/lib/supabaseClient.js`.

- Le variaveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Cria client unico utilizado por toda a aplicacao.

## Reatividade de UI

Regra adotada:

- Evitar duplicar estado local para dados de perfil.
- Ler `userProfile` direto do store quando o dado precisa atualizar em tempo real.

## Fluxo de boot

1. App verifica usuario autenticado.
2. App define usuario no store.
3. Dashboard carrega dados de dominio e perfil.
4. UI renderiza tabs com dados reativos.

## Decisoes tecnicas recentes

- Padronizacao de bucket: `avatars`.
- Correcao RLS Storage com indice `[1]` em `storage.foldername(name)`.
- Upload de avatar com nome unico para reduzir efeito de cache.
