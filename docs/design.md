# Design do Only-Tasks

Decisões tomadas nos mockups (referência visual: estilo "L1"). Cores abaixo são as usadas nos mockups.

## Ideia geral

Uma **folha branca estilo Notion** (a lista do dia) sobre um **universo escuro** com estrelas.
O toque retrô/gamer fica nas **áreas escuras** (menu, cartão de resumo, logo). A folha
branca, onde se lê e marca a lista, é limpa e amigável.

## Layout da tela do dia

- **Menu à esquerda** (recolhido por padrão): só ícones. Módulos, nesta ordem:
  **Tasks, Modelos, Notas, Configurações** (Modelos tem lista à esquerda e editor ao lado; Configurações tem perfil, senha e aparelhos. Configurações, Modelos e Acessos usam "janelas" (`components/win.tsx`): faixa clara com título preto, moldura azul-petróleo e sombra dura).
  Não há abas Dia/Semana/Mês.
- **Folha branca** no centro. No topo, **uma barra contínua que ocupa toda a largura da
  folha**, com **cinco cards do mesmo tamanho** (cada um com 1/5 da largura), encostados
  (sem espaço, separados só por um traço fino), cada um com uma informação e o conteúdo
  centralizado. O trio de dias (2º, 3º e 4º) fica no centro:
  1. sol + dia da semana ("Sábado"); no celular, só o ícone;
  2. `‹ 13` (dia anterior, clicável);
  3. `14` (dia atual, preenchido de azul-petróleo);
  4. `15 ›` (próximo dia, clicável);
  5. calendário, que abre um seletor de data com o atalho "Voltar para hoje".
- **"Voltar para hoje"** (atalho discreto): texto de 11px, sem borda nem fundo, em azul
  apagado, **centralizado logo abaixo da barra**, com um pequeno ícone de retorno. Só aparece
  quando o dia visto não é hoje (inclusive em dias ainda sem lista) e leva para `/`.
  A altura dele é sempre reservada (20px), para a lista não "pular" quando ele aparece.
  Abaixo, as seções recolhíveis (Manhã, Tarde, Noite) com itens marcáveis.
- **Cartão `RESUMO.SYS` à direita** (só com o menu recolhido): progresso em %, barra em
  blocos, progresso por seção, dias seguidos.

### Menu expansível

- Alça redonda na borda do menu, com setas (`››` abrir, `‹‹` fechar) e dica
  "Expandir menu" / "Recolher menu".
- **Expandido:** mostra os nomes (DIA, SEMANA, MÊS, MODELOS), o calendário do mês e
  "Recolher menu". O cartão de resumo **some**, exceto em **telas a partir de 1280px de largura CSS** (já descontados zoom e escala do Windows),
  onde continua visível. Quando o cartão está oculto, o progresso do dia aparece como
  uma faixa no topo da folha.
- O app lembra o estado (aberto/recolhido) entre visitas.
- No celular: o menu lateral some e entra uma barra inferior com Tasks, Modelos e Config. (`components/mobile-nav.tsx`); o "Sair" fica em Configurações. Em Modelos a lista e o editor viram duas telas (`?m=` abre o editor). Botões e campos têm pelo menos 41 px de altura.

### Calendário do menu

- Grade do mês, 7 colunas, centralizada sob o título e a legenda. Os quadradinhos
  **crescem com a tela** (variável CSS `--cal-cell`): 12px até 1535px de largura,
  14px a partir de 1536px, 16px a partir de 1920px (tamanhos menores ficavam pequenos
  em monitor grande). O espaço entre eles é 3px (4px a partir de 1920px).
- Cores no estilo contribuições do GitHub (verde mais vivo = mais tarefas feitas):
  `transparente`, `#0e4429`, `#006d32`, `#26a641`, `#39d353`.
- Nível pela **porcentagem do dia**: 0% (vazio/futuro), 1-25%, 26-50%, 51-75%, 76%+.
- Dias vazios têm só um contorno quase invisível; hoje tem contorno branco fino.
- Clicar em um dia abre aquele dia. A versão grande vive na aba Mês da folha.

## Interações na folha

- **Interruptor "Alterações valem: Só hoje | Sempre"** no topo da lista, à direita.
  Em "Sempre" aparece o aviso "Mudanças também vão para o modelo dos próximos dias".
- **Alça de arrastar** (seis pontinhos) na margem esquerda de cada item e seção;
  aparece ao passar o mouse e fica sempre visível no toque.
- **Clicar no item** abre o editor logo abaixo (título + descrição, Salvar/Cancelar).
  Itens com descrição mostram um ícone de folha.
- **Remover** (`×` no item, lixeira na seção) aparece ao passar o mouse; ao remover,
  surge o aviso escuro "… removido · Desfazer" na base da tela.
- **Menu "..."** ao lado das setas de dia: copiar para outra data, salvar como modelo,
  apagar o dia.

## Regra de fontes

| Onde | Fonte |
| --- | --- |
| Logo "OT" | Press Start 2P (pixel), com sombra dura azul-petróleo |
| Rótulos nas áreas escuras (menu, `RESUMO.SYS`, `PROGRESSO`, mês do calendário) | VT323 (terminal) |
| Tudo na folha branca e números | Fonte normal do sistema (sem retrô) |

## Cores

| Uso | Valor |
| --- | --- |
| Fundo | `#0a0a0f` + estrelas cinzas e brilho azul-acinzentado suave |
| Folha | `#ffffff`, texto `#37352f` |
| Itens marcados / barras na folha | `#2f6a96` (azul-petróleo) |
| Destaque nas áreas escuras | `#6fa8d6`, `#9ccaf0` |
| Cartão de resumo | fundo `#12141a`, borda `#3a4256`, sombra dura `rgba(111,168,214,.18)` |
| Scanlines | leves, só no fundo |

## Login

Deve seguir o mesmo nível retrô (a atualizar depois: hoje está mais retrô que a tela do dia).

## Notas (tela escura, estilo IDE)

Única tela inteiramente escura do app (as outras são papel branco); aprovada nos mockups da "IDE escura".

- **Raiz (`/notas`):** cada repositório é uma **pasta em pixel** (`components/notas/pixel-folder.tsx`, estilo Windows 3.1 / Mac System 1),
  todas iguais. Um clique seleciona, duplo clique (ou Enter) abre; no toque, um toque abre.
- **Repositório (`/notas/[repoId]`):** árvore de pastas e arquivos à esquerda e editor à direita, com o caminho, a aba do arquivo,
  a barra de status retrô e a linha de teclas de função (F2 nova nota, F3 nova pasta, F6 renomear, Del apagar).
- **Ícones como nas IDEs:** o arquivo ganha o ícone da **extensão** (`.js`, `.py`, `.sql`, `Dockerfile`...) e a pasta o do **assunto**
  sugerido pelo nome (banco de dados, infra, docker...). Regras em `src/lib/note-names.ts`.
- **Editores:** sem extensão ou `.nota` = editor de notas de tópicos (TipTap, guarda JSON); outras extensões = editor de texto com
  CodeMirror (cores de sintaxe pela extensão, números de linha, autoindentação, fechamento de parênteses; no celular, barra de símbolos
  acima do teclado). Abas dos arquivos abertos (até 20 por repositório, lembradas neste navegador; no celular viram uma faixa rolável). Painel "Estrutura" sob a árvore (computador): títulos da nota aberta ou do arquivo Markdown, com recuo por nível; clicar pula até o título. Salvamento automático.
- **Busca (Ctrl+Shift+F ou lupa):** troca a árvore pela lista de resultados, agrupada por arquivo, com o trecho e a palavra em destaque âmbar;
  "Em [repositório]" ou "Todos os repositórios". O resultado abre o arquivo já com a palavra selecionada (`?q=texto&l=linha`).
- **Mover/apagar:** botão direito, "⋯" ou toque longo; arrastar no computador; "Mover para…" (inclusive para outro repositório);
  apagar é reversível ("Desfazer"). Apagar um repositório pede o nome exato.
- **Celular:** a árvore e o editor são duas telas; a barra de formatação fica acima da barra inferior.
