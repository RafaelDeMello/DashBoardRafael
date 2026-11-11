# Design do Only-Tasks

Decisões tomadas nos mockups (referência visual: estilo "L1"). Cores abaixo são as usadas nos mockups.

## Ideia geral

Uma **folha branca estilo Notion** (a lista do dia) sobre um **universo escuro** com estrelas.
O toque retrô/gamer fica nas **áreas escuras** (menu, cartão de resumo, logo). A folha
branca, onde se lê e marca a lista, é limpa e amigável.

## Layout da tela do dia

- **Menu à esquerda** (recolhido por padrão): só ícones (Dia, Semana, Mês, Modelos, Sair).
- **Folha branca** no centro: ícone, data, abas Dia/Semana/Mês, seções recolhíveis
  (Manhã, Tarde, Noite) com itens marcáveis.
- **Cartão `RESUMO.SYS` à direita** (só com o menu recolhido): progresso em %, barra em
  blocos, progresso por seção, dias seguidos.

### Menu expansível

- Alça redonda na borda do menu, com setas (`››` abrir, `‹‹` fechar) e dica
  "Expandir menu" / "Recolher menu".
- **Expandido:** mostra os nomes (DIA, SEMANA, MÊS, MODELOS), o calendário do mês e
  "Recolher menu". O cartão de resumo **some**, exceto em **telas largas (1536px+)**,
  onde continua visível. Quando o cartão está oculto, o progresso do dia aparece como
  uma faixa no topo da folha.
- O app lembra o estado (aberto/recolhido) entre visitas.
- No celular: o menu vira gaveta (por cima da folha) e o resumo fica no topo da folha.

### Calendário do menu

- Grade do mês, 7 colunas, centralizada sob o título e a legenda. Os quadradinhos
  **crescem com a tela** (variável CSS `--cal-cell`): 10px até 1535px de largura,
  12px a partir de 1536px, 14px a partir de 1920px (7px ficava pequeno em monitor grande).
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
