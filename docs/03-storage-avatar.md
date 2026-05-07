# Storage de avatar

## Objetivo

Gerenciar avatar de usuario com seguranca, persistencia e atualizacao imediata na interface.

## Bucket

- Nome padrao: `avatars`
- Visibilidade: publica para leitura de imagem
- Escrita protegida por RLS em `storage.objects`

## Convencao de caminho

- Pasta por usuario + nome de arquivo unico.
- Exemplo: `user-uuid/avatar-1715720000000.jpg`

## Fluxo de upload

1. Validar tipo MIME permitido.
2. Validar tamanho maximo.
3. Validar dimensoes da imagem.
4. Gerar nome unico (timestamp).
5. Fazer upload no bucket `avatars`.
6. Gerar `publicUrl`.
7. Persistir `avatar_url` no `profiles` imediatamente.
8. Tentar remover arquivo antigo para evitar lixo.

## Fluxo de remocao

1. Ler `avatar_url` atual do perfil.
2. Extrair caminho interno do arquivo no bucket.
3. Remover arquivo do Storage.
4. Atualizar `profiles.avatar_url = null`.
5. Atualizar store global para refletir em tempo real.

## Problemas comuns

### 1) Avatar volta apos reload

Causa tipica:

- Remocao so no estado local, sem atualizar `profiles.avatar_url`.

Correcao:

- Persistir remocao no banco e atualizar store.

### 2) Upload retorna erro de RLS

Causas tipicas:

- Bucket no SQL diferente do bucket no codigo (`avatar` vs `avatars`).
- Uso de indice incorreto (`[0]`) em `storage.foldername(name)`.

Correcao:

- Padronizar bucket `avatars`.
- Usar indice `[1]` no Postgres.

### 3) Altera avatar, mas mostra imagem antiga

Causa tipica:

- Cache por URL constante (mesmo nome de arquivo).

Correcao:

- Nome de arquivo unico por upload.
