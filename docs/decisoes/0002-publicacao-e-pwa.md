# 0002 - Publicação com Docker Compose e Caddy, e PWA sem service worker

- **Status:** aceita
- **Data:** 2026-11-17

## Problema

Colocar o app na internet (VPS) com HTTPS, com o banco protegido e com backup, e permitir
que ele seja instalado no celular e no computador.

## Decisões

- **Docker Compose** com cinco serviços: `caddy`, `app`, `db`, `migrate` e `backup`.
- **Caddy** como proxy reverso e responsável pelo HTTPS.
- **Next.js em modo `standalone`**, imagem de produção que roda sem root.
- **PWA instalável** por manifesto e ícones gerados por código, **sem service worker**.

## Motivos

- **Compose na VPS:** o mesmo mecanismo do desenvolvimento, simples de entender, atualizar e
  desfazer. *Custo aceito:* uma só máquina (sem alta disponibilidade).
- **Caddy em vez de Nginx:** emite e renova o certificado sozinho e a configuração cabe em
  poucas linhas, o que reduz a chance de errar no HTTPS. Também sobrescreve `X-Forwarded-For`
  com o IP real, o que o limite de tentativas de login exige.
- **Rede interna sem internet para `app` e `db`, e nenhuma porta publicada por eles:** se
  um deles fosse invadido, não conseguiria sair para a internet, e o Docker não abre essas
  portas por cima do firewall.
- **Sem service worker:** o app é online (os dados vivem no servidor) e não precisa funcionar
  offline. Um cache de páginas poderia mostrar dados de uma sessão anterior depois de um
  logout, e erros de cache são difíceis de depurar. *Custo aceito:* sem modo offline.
- **Manifesto e ícones públicos:** o navegador os pede sem login; o proxy os libera
  explicitamente (e há teste cobrindo isso).

## Ainda por decidir

Backup automático fora da VPS, monitoramento, `Content-Security-Policy`, e (se o app passar a
rodar em mais de uma instância) mover o limite de tentativas para o banco ou Redis.
