# 0001 - Stack base do MVP

- **Status:** aceita (login ainda pendente, ver 0002 quando existir)
- **Data:** 2026-11-10

## Problema

Escolher as tecnologias do Only-Tasks (MVP): tela, servidor, banco, acesso no celular
e onde o app vai rodar.

## Decisão

- **TypeScript + Next.js** para tela e servidor no mesmo projeto.
- **PostgreSQL** rodando em **Docker** no desenvolvimento.
- **Celular:** site responsivo instalável como **PWA**.
- **Hospedagem futura:** VPS, com o mesmo Docker usado em desenvolvimento.

## Motivos

- **TypeScript + Next.js:** uma linguagem só e um projeto só reduzem a quantidade de
  coisas para aprender e manter num MVP de uma pessoa. TypeScript evita uma classe
  inteira de erros (tipos trocados) antes de o código rodar.
  *Custo aceito:* o servidor fica acoplado ao Next.js. No projeto grande, com backend
  próprio, a separação será reavaliada.
- **Postgres em Docker:** banco relacional combina com dados bem estruturados (usuários,
  listas, itens). Rodar em Docker faz o ambiente de desenvolvimento ser igual ao da VPS,
  evitando o "na minha máquina funciona".
  *Custo aceito:* é preciso aprender Docker e cuidar de backups na VPS.
- **PWA:** um único código atende celular e computador, sem loja de aplicativos.
  *Custo aceito:* menos acesso a recursos nativos do aparelho (não precisamos deles agora).
  PWA exige HTTPS em produção.
- **VPS:** controle total e aprendizado de infraestrutura. Fica para depois do app
  funcionar localmente.
  *Custo aceito:* nós mesmos cuidamos de atualizações, segurança do servidor e backups.

## Ainda por decidir

- Como acessar o banco no código (SQL direto, ou uma biblioteca como Prisma/Drizzle).
- Como fazer o login e a sessão (ver lição de login).
- Testes, validação de dados e gerenciador de pacotes.
