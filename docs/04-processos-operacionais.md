# Processos operacionais

## Objetivo

Padronizar como evoluir o projeto com seguranca e rastreabilidade.

## Processo de desenvolvimento

1. Entender requisito funcional.
2. Validar impacto em UI, store e banco.
3. Implementar em pequenas etapas.
4. Testar manualmente fluxo principal e regressao.
5. Atualizar documentacao operacional.

## Processo de mudanca em Supabase

1. Definir mudanca SQL.
2. Executar em ambiente alvo.
3. Verificar resultado com consultas de validacao.
4. Registrar SQL e impacto no changelog operacional.

## Processo de mudanca de perfil/avatar

1. Alterar comportamento em `Settings`.
2. Garantir persistencia imediata em `storeSupabase`.
3. Validar reflexo reativo no `Dashboard` e `Sidebar`.
4. Verificar upload, troca, remocao e reload.

## Processo de release local

1. `npm run lint`
2. `npm run build`
3. Testes manuais criticos:
   - login/logout
   - alteracao de perfil
   - upload/troca/remocao de avatar
   - navegacao entre tabs

## Regra de ouro

Toda alteracao que mexe em persistencia deve ter:

- criterio de validacao
- impacto esperado
- rollback simples documentado

## Modo professor (aprendizado guiado)

Quando o usuario estiver em trilha de aprendizado, aplicar este fluxo:

1. Pergunta de entendimento antes da implementacao.
2. Explicacao do plano em etapas curtas.
3. Implementacao com explicacao linha por linha.
4. Perguntas de revisao para confirmar aprendizado.
5. Fechamento com resumo do que foi aprendido e proximo exercicio.
