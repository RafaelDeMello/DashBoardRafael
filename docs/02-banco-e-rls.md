# Banco de dados e RLS

## Tabelas principais

- `profiles`
  - `id` (uuid, referencia auth.users)
  - `email` (texto)
  - `full_name` (texto)
  - `avatar_url` (texto)
  - `app_theme` (texto)
- `transactions`
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
