# Runbook de debug

## Objetivo

Fornecer roteiro rapido para diagnosticar falhas recorrentes.

## 1. Falha de autenticacao

Verificar:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`.
- Retorno de `supabase.auth.getUser()`.
- Erros no console do navegador.

## 2. Alteracao de perfil nao aparece na hora

Verificar:

- Se a UI le `userProfile` diretamente do store.
- Se existe estado local duplicado no componente.
- Se `updateUserProfile` esta sendo chamado e resolve sem erro.

## 3. Upload de avatar com erro RLS

Validar:

- Bucket correto no codigo: `avatars`.
- Politicas de `storage.objects` para `bucket_id = 'avatars'`.
- Uso de `(storage.foldername(name))[1] = auth.uid()::text`.
- Caminho de upload no formato `userId/nome.ext`.

## 4. Avatar removido volta apos reload

Validar:

- Se `profiles.avatar_url` foi atualizado para `null`.
- Se remocao do arquivo em Storage foi executada.
- Se store global foi atualizado apos remocao.

## 5. Avatar nao troca visualmente

Validar:

- Se nome de arquivo e unico por upload.
- Se URL nova esta sendo salva no banco.

## Consultas SQL uteis

### Listar politicas do storage

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname, cmd;
```

### Testar indice de foldername

```sql
SELECT
  storage.foldername('123/avatar.jpg') AS pasta_array,
  (storage.foldername('123/avatar.jpg'))[1] AS idx_1,
  (storage.foldername('123/avatar.jpg'))[0] AS idx_0;
```

## Campos de log recomendados

- `user.id`
- `filePath` usado no upload/remocao
- `bucket`
- `error.message`
- `error.details`
- `error.hint`
