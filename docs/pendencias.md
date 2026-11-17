# O que falta fazer

Lista viva do que ficou combinado e ainda não foi feito. Atualizada em 2026-11-17.

## Notas — etapa 2 (a etapa 1 está pronta e commitada)

Ordem sugerida:

1. **Cores de sintaxe** no editor de código (hoje é texto simples com números de linha). Plano: CodeMirror, carregado só na tela de Notas.
   Linguagens iniciais: `.js .ts .py .sql .html .css .json .yml .sh .md` e `Dockerfile`.
2. **Busca por nome e conteúdo**: troca a árvore pela lista de resultados agrupada por arquivo, com o trecho e a palavra em destaque;
   escopo "neste repositório" ou "em todos".
3. **Abas dos arquivos abertos** (hoje há uma aba só) e **painel "Estrutura"** (títulos da nota, como o Outline do VS Code).
4. **Seletor de ícone da pasta** ao criar (hoje o ícone é sugerido pelo nome e só dá para trocar por código/rename com `icon`).
5. **Opcional:** visão alternativa em colunas (Finder) na raiz de Notas.

Pontos a conferir na etapa 1 (não testados):
- Arrastar e soltar no computador (testado só por código, não com o mouse real) e toque longo no celular.
- Salvamento de notas grandes e perda de conexão durante o salvamento automático.
- Teste real no celular (instalado como PWA), principalmente teclado e barra de formatação.

## Outras frentes combinadas

- **Convites / compartilhamento**: o cadastro aberto com liberação pelo administrador já existe. Falta o **compartilhamento** entre contas
  (por repositório de Notas e por lista), com regras de quem vê e edita o quê.
- **Semana e Mês** (baixa prioridade; a utilidade foi questionada): visões agregadas das tarefas.
- **Aviso de cadastro novo ao administrador** (hoje precisa abrir o painel) e verificação de e-mail.
- **Primeiro uso**: criar a conta de administrador real (`npm run user:create -- --admin`).

## Publicação e operação

- Publicar numa VPS real e testar o certificado de verdade (a stack Docker/Caddy só foi testada localmente).
- Backup fora do servidor (cópia externa), monitoramento, CSP e fail2ban.
- Limite de tentativas de login em memória: trocar por Redis ou tabela se houver mais de uma instância.
- Renovação do cookie de sessão no uso (hoje só o prazo no banco é estendido).
- Testes automatizados no navegador (hoje só testes de código e conferência manual).

## Limpeza futura

- Apagar de vez (purga) repositórios e itens de Notas apagados há muito tempo (hoje "apagar" é só reversível).
- 21 avisos de `npm audit` em ferramentas de desenvolvimento (vite/vitest); nas dependências de produção são 0.
