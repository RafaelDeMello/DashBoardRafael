# Regras operacionais do projeto

Versao: 1.0
Status: ativa

## Objetivo

Padronizar como as entregas sao finalizadas para manter codigo, documentacao e operacao alinhados.

## Regra principal

Nenhuma feature e considerada concluida sem atualizacao de documentacao.

## Checklist obrigatorio por entrega

1. Atualizar `README.md` com funcionalidades visiveis e mudancas relevantes do produto.
2. Atualizar `docs/01-arquitetura-tecnica.md` quando houver mudanca de estrutura, fluxo ou responsabilidade tecnica.
3. Atualizar `docs/06-changelog-operacional.md` com entrada nova da entrega (data, contexto, impacto, arquivos e proximos passos).
4. Rodar `npm run build` e validar que a build concluiu com sucesso.

## Regras de manutencao de documentacao

- Sempre escrever em portugues.
- Preferir texto objetivo e orientado a operacao.
- Evitar informacoes desatualizadas; quando substituir processo antigo, remover ou atualizar o trecho antigo.
- Referenciar caminhos reais de arquivo quando descrever alteracoes.

## Regras de entrega tecnica

- Nao finalizar alteracao com TODO tecnico sem registrar no changelog operacional.
- Para mudancas em Supabase (SQL/RLS/Storage), registrar resumo no changelog com evidencia de validacao.
- Em mudancas de comportamento de UI, validar fluxo manual de ponta a ponta.

## Definition of Done (DoD)

Uma entrega so pode ser marcada como concluida quando todos os itens abaixo forem atendidos:

- Codigo implementado e coerente com o requisito.
- Build executada com sucesso.
- Documentacao obrigatoria atualizada (README + arquitetura quando aplicavel + changelog).
- Proximo passo registrado quando houver pendencia tecnica.

## Evolucao deste arquivo

Este documento pode ser atualizado sempre que o processo do time evoluir.
Ao alterar regras, incremente a versao e registre a mudanca em `docs/06-changelog-operacional.md`.
