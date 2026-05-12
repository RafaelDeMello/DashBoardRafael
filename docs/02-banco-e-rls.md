# Banco de dados e RLS

## Tabelas principais

- `profiles`
  - `id` (uuid, referencia auth.users)
  - `email` (texto)
  - `full_name` (texto)
  - `avatar_url` (texto)
  - `app_theme` (texto)
- `transactions`
  - `competence_month` (int)
  - `competence_year` (int)
  - `is_recurring_generated` (bool)
  - `recurring_source_id` (uuid, origem recorrente)
  - `category_id` (uuid, referencia para categories)
- `recurring_transactions`
  - `id` (uuid)
  - `user_id` (uuid)
  - `type` (`income` ou `expense`)
  - `category_id` (uuid)
  - `description` (texto)
  - `value` (numeric)
  - `day_of_month` (1..31)
  - `credit_card_id` (uuid, opcional)
  - `is_active` (bool)
- `categories`
- `credit_cards`
- `credit_card_invoices`

## Principio de seguranca

Cada usuario so pode acessar e manipular os proprios dados.

## Politicas esperadas

### Tabelas relacionais

Padrao de politica para tabelas com `user_id`:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `WITH CHECK (auth.uid() = user_id)`
- `UPDATE`: `USING (auth.uid() = user_id)` + opcional `WITH CHECK`
- `DELETE`: `USING (auth.uid() = user_id)`

Para `profiles` (chave no campo `id`):

- `SELECT`: `auth.uid() = id`
- `UPDATE`: `auth.uid() = id`

Para `recurring_transactions`:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `WITH CHECK (auth.uid() = user_id)`
- `UPDATE`: `USING (auth.uid() = user_id)` + `WITH CHECK (auth.uid() = user_id)`
- `DELETE`: `USING (auth.uid() = user_id)`

## Competencia mensal e idempotencia

Padrao adotado para consultas mensais:

- filtrar por `user_id + competence_year + competence_month`

Padrao adotado para evitar duplicacao de recorrentes:

- indice unico em `transactions` com:
  - `user_id`
  - `recurring_source_id`
  - `competence_year`
  - `competence_month`
  - com condicao `recurring_source_id IS NOT NULL`

Regra de negocio de data recorrente:

- se `day_of_month` nao existir no mes alvo, usar o ultimo dia do mes.

## Storage RLS (bucket avatars)

Bucket padrao: `avatars`.

Trecho essencial de validacao:

- `(storage.foldername(name))[1] = auth.uid()::text`

Motivo:

- Arrays no Postgres sao indexados a partir de `1`.
- Caminho esperado do arquivo: `userId/nome-arquivo.ext`.
- `foldername(name)[1]` deve corresponder ao `auth.uid()`.

## Politicas recomendadas para storage.objects

- Leitura publica no bucket `avatars`.
- Upload autenticado no bucket `avatars` com `WITH CHECK` por pasta do usuario.
- Update no bucket `avatars` com `USING` e `WITH CHECK` por pasta do usuario.
- Delete no bucket `avatars` com `USING` por pasta do usuario.

## Checklist de consistencia

- Nome do bucket igual em codigo e SQL (`avatars`).
- Politicas sem duplicidade antiga.
- Sem politica publica de upload irrestrito.
- Upload usando caminho com pasta do usuario.
