# Changelog operacional

Este arquivo foi preparado para atualizacao continua (diaria/semanal).

## Como usar

Para cada mudanca relevante, adicione um bloco novo no topo com o template abaixo.

---

## Template de entrada

````md
## [AAAA-MM-DD] Titulo curto da mudanca

- Contexto:
- Mudanca aplicada:
- Motivo:
- Impacto esperado:
- Arquivos alterados:
  - src/arquivo1
  - src/arquivo2
- SQL executado (se houver):
```sql
-- cole aqui
```
- Evidencia de validacao:
  - [ ] Fluxo principal validado
  - [ ] Build ok
  - [ ] Sem erro novo no console
- Riscos/pontos de atencao:
- Proximo passo:
````

---

## [2026-05-11] Mitigacao de erro JWT expired em configuracoes

- Contexto: atualizacoes de perfil/avatar passaram a falhar com `Erro ao atualizar perfil: JWT expired`.
- Mudanca aplicada:
  - adicionada funcao `ensureActiveSession()` no `src/storeSupabase.js`.
  - validacao de sessao antes de operacoes criticas:
    - `updateUserProfile`
    - `uploadAvatar`
    - `removeAvatar`
  - fallback de refresh via `supabase.auth.refreshSession()` com mensagem clara quando expirar de vez.
  - adicionado listener de `TOKEN_REFRESHED` no `src/lib/supabaseClient.js` para rastreio.
  - documentado procedimento no runbook (`docs/05-runbook-debug.md`).
- Motivo: reduzir falha de persistencia por expiracao de token em sessoes longas.
- Impacto esperado:
  - menor incidencia de erro JWT ao salvar configuracoes.
  - recuperacao automatica de sessao quando possivel.
  - feedback mais claro ao usuario quando novo login for necessario.
- Arquivos alterados:
  - `src/storeSupabase.js`
  - `src/lib/supabaseClient.js`
  - `docs/05-runbook-debug.md`
  - `docs/06-changelog-operacional.md`
- SQL executado (se houver):
```sql
-- nao se aplica
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - se refresh token estiver invalido, usuario ainda precisara autenticar novamente.
- Proximo passo:
  - validar em sessao longa (idle) e confirmar comportamento de refresh/login.

## [2026-05-11] Integracao da competencia mensal na UI do Dashboard

- Contexto: apos criar a base mensal no store, foi necessario conectar o fluxo na interface para troca de mes/ano sem refresh.
- Mudanca aplicada:
  - ajustado `src/components/Dashboard.jsx` para usar:
    - `loadTransactionsByPeriod`
    - `ensureMonthlyRecurringTransactions`
  - adicionado seletor de competencia no topo da aba dashboard:
    - mes anterior
    - mes seguinte
    - botao "Mes atual"
  - adicionado estado de carregamento do periodo (`periodLoading`).
- Motivo: refletir receitas/despesas por competencia mensal de forma reativa e previsivel.
- Impacto esperado:
  - mudancas de mes/ano atualizam cards e graficos sem reload manual.
  - geracao de recorrentes acontece automaticamente ao trocar competencia.
  - comportamento consistente para navegacao em meses passados e futuros.
- Arquivos alterados:
  - `src/components/Dashboard.jsx`
  - `README.md`
  - `docs/01-arquitetura-tecnica.md`
  - `docs/04-processos-operacionais.md`
  - `docs/06-changelog-operacional.md`
- SQL executado (se houver):
```sql
-- nao se aplica
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - falta implementar aba dedicada de lancamentos por competencia.
  - manter ordem de chamada (gerar recorrentes antes de carregar periodo).
- Proximo passo:
  - criar CRUD de lancamentos (receita/despesa) por competencia na UI.

## [2026-05-11] Base mensal de transacoes e recorrencia automatica no store

- Contexto: inicio da reconstrucao de receitas/despesas com competencia mensal e historico preservado.
- Mudanca aplicada:
  - implementada no `storeSupabase` a funcao `loadTransactionsByPeriod(userId, month, year)` com filtro por competencia.
  - implementada no `storeSupabase` a funcao `ensureMonthlyRecurringTransactions(userId, month, year)`.
  - regra de recorrencia com ajuste de dia invalido para ultimo dia do mes.
  - idempotencia de geracao por `recurring_source_id` no periodo.
- Motivo: preparar base para "reinicio mensal" sem apagar historico e com recorrentes automaticos.
- Impacto esperado:
  - consultas mensais previsiveis por competencia.
  - menor risco de duplicacao ao gerar recorrentes no mesmo mes.
  - suporte direto ao fluxo de organizacao financeira mensal.
- Arquivos alterados:
  - `src/storeSupabase.js`
  - `README.md`
  - `docs/01-arquitetura-tecnica.md`
  - `docs/02-banco-e-rls.md`
  - `docs/04-processos-operacionais.md`
  - `docs/06-changelog-operacional.md`
- SQL executado (se houver):
```sql
-- adicao de colunas de competencia em transactions
-- criacao da tabela recurring_transactions
-- criacao de indice unico de idempotencia
-- criacao de RLS para recurring_transactions
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - ainda falta integrar seletor de competencia e tela de lancamentos na UI.
  - validar em banco se schema e indices foram aplicados exatamente como planejado.
- Proximo passo:
  - integrar competencia no dashboard e disparo automatico no login/troca de periodo.

## [2026-05-10] Adicao da regra de mentoria tecnica (modo professor)

- Contexto: foi solicitado formalizar no projeto a atuacao do assistente como professor tecnico, com foco em aprendizado ativo.
- Mudanca aplicada:
  - adicionada secao "Regra de mentoria tecnica (modo professor)" em `docs/REGRAS_OPERACIONAIS.md`.
  - adicionada exigencia de validacao de aprendizado no DoD em `docs/REGRAS_OPERACIONAIS.md`.
  - adicionada secao "Modo professor (aprendizado guiado)" em `docs/04-processos-operacionais.md`.
- Motivo: garantir consistencia pedagogica nas proximas implementacoes e reforcar raciocinio tecnico do usuario.
- Impacto esperado:
  - mais perguntas de conhecimento durante as tarefas.
  - explicacoes linha por linha nas implementacoes.
  - melhor consolidacao de logica e tomada de decisao tecnica.
- Arquivos alterados:
  - `docs/REGRAS_OPERACIONAIS.md`
  - `docs/04-processos-operacionais.md`
  - `docs/06-changelog-operacional.md`
- SQL executado (se houver):
```sql
-- nao se aplica
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - manter equilibrio entre profundidade didatica e ritmo de entrega.
- Proximo passo:
  - aplicar o modo professor na implementacao da logica mensal de receitas e despesas.

## [2026-05-06] Criacao das regras operacionais v1.0

- Contexto: foi definida a necessidade de padronizar fechamento de features com documentacao obrigatoria.
- Mudanca aplicada:
  - criado o arquivo `docs/REGRAS_OPERACIONAIS.md`.
  - definida regra principal de entrega: nenhuma feature e concluida sem atualizacao de documentacao.
  - adicionado checklist obrigatorio por entrega e Definition of Done (DoD).
- Motivo: evitar perda de contexto e garantir consistencia entre codigo, arquitetura e operacao.
- Impacto esperado:
  - maior previsibilidade no processo de entrega.
  - documentacao sempre atualizada junto com novas funcionalidades.
- Arquivos alterados:
  - `docs/REGRAS_OPERACIONAIS.md`
  - `docs/06-changelog-operacional.md`
- SQL executado (se houver):
```sql
-- nao se aplica
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - manter disciplina de atualizar README, arquitetura e changelog em toda entrega.
- Proximo passo:
  - aplicar a regra nas proximas features de cartoes, faturas e transacoes.

## [2026-05-06] Correcao de perfil reativo e avatar

- Contexto: alteracoes em perfil/avatar/tema so refletiam totalmente apos refresh manual.
- Mudanca aplicada:
  - dashboard passou a consumir `userProfile` de forma reativa no store.
  - upload de avatar com nome unico por arquivo.
  - persistencia imediata de `avatar_url` no perfil.
  - remocao de avatar ajustada para bucket `avatars` e limpeza de referencia no perfil.
- Motivo: eliminar inconsistencias de UI, cache e persistencia.
- Impacto esperado:
  - alteracoes de tema/avatar/nome aparecem sem refresh.
  - menor risco de cache em troca de avatar.
- Arquivos alterados:
  - `src/components/Dashboard.jsx`
  - `src/components/Settings.jsx`
  - `src/storeSupabase.js`
- SQL executado (se houver):
```sql
-- Ajustes de policies storage.objects para bucket 'avatars'
-- com foldername(name)[1] = auth.uid()::text
```
- Evidencia de validacao:
  - [x] Fluxo principal validado
  - [x] Build ok
  - [x] Sem erro novo no console
- Riscos/pontos de atencao:
  - manter alinhamento entre nome do bucket no codigo e nas policies.
  - monitorar crescimento de arquivos se limpeza do avatar antigo falhar.
- Proximo passo:
  - revisar validacoes de entrada em cartoes e faturas.
