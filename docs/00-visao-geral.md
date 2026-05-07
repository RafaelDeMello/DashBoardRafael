# Visao geral do projeto

## Objetivo

O Dashboard Rafael centraliza controle financeiro pessoal com foco em simplicidade de uso, dados por usuario e base segura em Supabase.

## Escopo funcional atual

- Autenticacao por email/senha.
- Perfil do usuario com:
  - `full_name`
  - `app_theme`
  - `avatar_url`
- Upload e remocao de avatar em Storage.
- Dashboard com visao geral de dados.
- Gestao de cartoes de credito.
- Gestao de faturas.

## Principios do projeto

- Isolamento de dados por usuario com RLS.
- Atualizacao reativa na UI sem necessidade de refresh manual.
- Fluxos com validacao basica de entrada.
- Manutencao orientada por documentacao operacional.

## Situacao arquitetural

- Frontend SPA em React + Zustand.
- Backend as a Service no Supabase.
- Regras de seguranca no banco (RLS).

## Evolucao prevista

- Refinamento de validacoes em formularios.
- Melhorias de observabilidade (logs e runbooks).
- Revisao de performance no bundle frontend.
