# 0003 - Cadastro aberto com liberação pelo administrador

- **Status:** aceita
- **Data:** 2026-11-17

## Problema

Hoje contas só nascem por comando no servidor. Para a esposa (e outras pessoas) usarem o app, é
preciso um jeito de criar conta sem acessar o servidor, sem abrir o app para qualquer um.

## Opções consideradas

1. Convites com link de uso único: o admin gera um link por pessoa. Mais fechado, mas dá mais trabalho a cada pessoa nova.
2. Cadastro aberto com liberação: qualquer um cria conta, e ela só funciona depois que o admin libera. Simples para quem usa; abre a porta de cadastro para a internet.

## Decisão

Opção 2. A conta nasce com `status = pending`; o administrador (`role = admin`, criado só por script)
libera (`approved`) ou bloqueia (`blocked`) em `/admin`. O administrador não usa as listas.

## Motivo

É o fluxo que o Rafael pediu e o mais simples de usar. O que aceitamos e como mitigamos:

- **O cadastro é público.** Limite de 5 tentativas por hora por IP e teto de 50 contas aguardando.
- **Dá para descobrir se um e-mail já tem conta** (sem verificação de e-mail não há como esconder). Aceito para uso pessoal.
- **Segurança do acesso:** o padrão do banco é `pending` (falha fechada); `verifySession` só deixa passar conta liberada e não-admin, e é o que toda página e ação já usam. `verifyAdmin` protege o painel. Bloquear apaga as sessões da pessoa na hora.
- **Papel e status nunca vêm do formulário:** o cadastro não os lê.
- Sem e-mail de aviso: o admin precisa abrir o painel para ver quem está esperando.
