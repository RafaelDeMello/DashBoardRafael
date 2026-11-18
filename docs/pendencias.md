# O que falta fazer

Lista viva do que ficou combinado e ainda não foi feito. Atualizada em 2026-11-17.

## Notas — etapa 2 (a etapa 1 está pronta e commitada)

Ordem sugerida:

1. ~~**Cores de sintaxe** no editor de código~~ **feito** (CodeMirror, uma linguagem carregada por vez; ícones extras de `.git`, `.env`,
   `package.json`, lockfiles, `LICENSE`, `Makefile`, Java, C/C++, Go, Rust, PHP, Vue, XML, TOML, CSV e TXT).
2. ~~**Busca por nome e conteúdo**~~ **feita** (painel no lugar da árvore, agrupado por arquivo, escopo "neste repositório" ou "todos", Ctrl+Shift+F).
   Fica para depois: busca sem diferenciar acentos (hoje diferencia) e destaque de todas as ocorrências no editor (hoje seleciona a primeira).
3. ~~**Abas dos arquivos abertos**~~ **feitas** (até 20 por repositório, lembradas no navegador; ponto amarelo = ainda salvando; fechar a ativa abre a da direita).
   ~~**Painel "Estrutura"**~~ **feito** (títulos H1/H2 das notas e `#` dos arquivos Markdown, no computador; clique pula até o título).
   Ainda não existe no celular (a árvore e o editor são telas separadas) nem para funções de código.
4. ~~**Seletor de ícone da pasta**~~ **feito** (clicar no ícone ao criar a pasta, ou "Mudar ícone…" no menu da pasta; "Automático" volta à sugestão pelo nome).
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
