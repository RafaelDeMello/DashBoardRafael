# Publicação na VPS

Guia para colocar o Only-Tasks no ar com Docker, HTTPS automático e backup diário.
Tudo está em `docker-compose.prod.yml`; este documento é o passo a passo.

## O que sobe

| Serviço | Para que serve | Exposto à internet? |
| --- | --- | --- |
| `caddy` | recebe a internet, faz o HTTPS (certificado automático) e repassa ao app | sim, portas 80 e 443 |
| `app` | o Only-Tasks (Next.js), rodando sem root | **não** (só o Caddy o alcança) |
| `db` | PostgreSQL 17, com os dados em um volume Docker | **não** |
| `migrate` | aplica as migrações do banco e termina; também cria usuários | não |
| `backup` | copia o banco todo dia para a pasta `backups/` | não |

O banco e o app ficam numa rede **sem acesso à internet** (`internal: true`).

## Antes de começar

- Uma VPS com Ubuntu 22.04 ou 24.04 (1 GB de RAM já serve, 2 GB é mais confortável para o build).
- Um **domínio** (ou subdomínio) com o DNS (registro `A`) apontando para o IP da VPS.
  Sem domínio não há HTTPS com certificado real, e o app **precisa** de HTTPS em produção
  (o cookie de sessão só trafega por HTTPS).

## 1. Preparar a VPS (uma vez)

```bash
# como root, na primeira conexão
adduser rafael && usermod -aG sudo rafael
rsync --archive --chown=rafael:rafael ~/.ssh /home/rafael      # copia sua chave SSH

# Docker (instalador oficial)
curl -fsSL https://get.docker.com | sh
usermod -aG docker rafael

# Firewall: só SSH, HTTP e HTTPS
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
ufw enable
```

Depois entre como `rafael` e **desative o login por senha e o login do root** no SSH
(`/etc/ssh/sshd_config`: `PasswordAuthentication no`, `PermitRootLogin no`), reiniciando o `sshd`.

> Cuidado: o Docker publica portas **por cima** do `ufw`. Por isso o `db` e o `app` não
> publicam porta nenhuma: só o Caddy aparece para fora.

## 2. Colocar o código e configurar

```bash
git clone <seu-repositorio> only-tasks && cd only-tasks
cp .env.production.example .env.production
nano .env.production      # SITE_ADDRESS = seu domínio; POSTGRES_PASSWORD = openssl rand -hex 24
chmod 600 .env.production
```

## 3. Subir

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

O primeiro build demora alguns minutos. Quando tudo estiver `healthy`, o Caddy pede o
certificado sozinho (pode levar cerca de um minuto na primeira vez).

## 4. Criar o administrador e o seu usuário

Quem se cadastra pela tela fica **aguardando liberação**; o administrador libera em `/admin`.
O administrador e o seu próprio usuário são criados no servidor. A senha é pedida no terminal,
oculta (mínimo 12 caracteres). Primeiro o administrador (só vê o painel de acessos):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \n  run --rm -it migrate node scripts/create-user.ts --admin
```

Depois o seu usuário comum (já nasce liberado):

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm -it migrate node scripts/create-user.ts
```

Depois abra `https://seu-dominio` e entre.

## Atualizar para uma versão nova

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

As migrações rodam sozinhas antes de o app novo subir. Faça um backup manual antes de
mudanças grandes (abaixo).

## Backups

O serviço `backup` grava `backups/onlytasks-AAAAMMDDTHHMMSSZ.dump` todo dia e apaga os mais
velhos que `BACKUP_RETENTION_DAYS` (14 por padrão).

```bash
# backup manual agora
docker compose --env-file .env.production -f docker-compose.prod.yml exec backup \
  pg_dump --format=custom --file=/backups/manual.dump

# ver os arquivos
ls -lh backups/
```

### Restaurar

```bash
# 1) pare o app para ninguém escrever durante a restauração
docker compose --env-file .env.production -f docker-compose.prod.yml stop app

# 2) restaure (apaga e recria os objetos do banco a partir do arquivo)
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  pg_restore --clean --if-exists --no-owner -U onlytasks -d onlytasks < backups/ARQUIVO.dump

# 3) suba o app de novo
docker compose --env-file .env.production -f docker-compose.prod.yml start app
```

**Importante:** os backups ficam **na mesma VPS**. Se a VPS for perdida, eles somem junto.
Copie a pasta `backups/` para outro lugar de vez em quando (por exemplo, `rsync` ou `scp` para o
seu computador). Backup que você nunca testou restaurar não é backup: teste a restauração.

## Dia a dia

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app     # logs do app
docker compose --env-file .env.production -f docker-compose.prod.yml logs backup     # últimos backups
docker compose --env-file .env.production -f docker-compose.prod.yml restart app
```

`GET /api/health` responde `{"status":"ok"}` quando o app e o banco estão bem (é o que o Docker
usa para saber se o app está saudável).

## Testar tudo no seu computador antes

Dá para subir a mesma stack localmente, sem domínio:

```bash
# .env.production com SITE_ADDRESS=http://localhost, HTTP_PORT=8080 e HTTPS_PORT=8443
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
# abra http://localhost:8080
```

## Segurança: o que já está e o que falta

Já está: HTTPS com HSTS; app e banco sem porta pública e sem internet; app rodando sem root;
cabeçalhos `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Permissions-Policy`;
cookie `__Host-session` com `Secure` e `HttpOnly`; o IP real do cliente vem do Caddy (que
sobrescreve `X-Forwarded-For`), então o limite de tentativas de login não pode ser enganado.

Falta (boas próximas etapas): backup **fora** da VPS automático; monitoramento (aviso se o site
cair); `fail2ban` para o SSH; atualizações de segurança automáticas (`unattended-upgrades`);
cabeçalho `Content-Security-Policy`; e o limite de tentativas hoje fica em memória, o que serve
para **uma** instância do app.
