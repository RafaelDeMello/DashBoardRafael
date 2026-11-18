# Only-Tasks: Especificação do MVP

> Itens marcados com **[ABERTO]** dependem de decisão do Rafael.

## Objetivo

Organizador de rotinas para manter e estimular o foco. O usuário monta a estrutura
do seu dia em listas marcáveis, acompanha o progresso e acessa tudo pelo celular
e pelo computador.

O exemplo de lista que o Rafael mostrou (Manhã / Tarde / Noite) é só ilustração:
o conteúdo é livre.

## Conceitos

- **Modelo de dia:** uma estrutura de lista reutilizável (seções + itens).
  Podem existir vários modelos (ex.: dia de semana, fim de semana).
- **Dia:** a lista real de uma data. Nasce como uma **cópia idêntica** de um modelo
  e pode ser editada sem afetar o modelo.
- **Seção:** agrupador dentro do dia/modelo (ex.: Manhã, Tarde, Noite). Nome livre.
- **Item:** uma linha da lista, com caixinha marcável e ordem numerada.

## Funcionalidades do MVP

### Listas e itens
- Cada item tem: título, caixinha de feito/não feito e, opcionalmente, uma descrição
  que aparece ao clicar. O visual principal é só a lista.
- Os itens têm **ordem numerada fixa**; **arrastar** um item altera a ordem
  (e a numeração acompanha).
- Itens ficam dentro de seções.

### Notas
- **Repositórios** (raiz de uma árvore), **pastas** (até 8 níveis) e **arquivos**; nomes únicos por pasta (sem diferenciar maiúsculas).
- Arquivo sem extensão ou `.nota` = nota de tópicos; com extensão de código = editor de texto.
- Mover (inclusive entre repositórios, sem ciclos), renomear, apagar com "Desfazer". Limites: 50 repositórios, 2000 itens por repositório, 500 mil caracteres por arquivo.
- Cores de sintaxe no editor de código e busca por nome e conteúdo (feitas; busca limitada a 50 arquivos, mínimo de 2 letras). Abas de arquivos abertos (feitas). Ainda não feito: painel "Estrutura" e seletor de ícone da pasta.

### Modelos e dias
- Criar, editar e apagar modelos.
- Criar o dia de uma data **copiando um modelo** (cópia idêntica).
- Editar um dia livremente (adicionar, remover, reordenar, renomear itens e seções).
- Ao editar, escolher o alcance da mudança:
  - **Só hoje:** altera apenas aquele dia.
  - **Permanente:** altera também o modelo, valendo para os próximos dias criados a partir dele.
- Copiar a lista de um dia para outro dia como ponto de partida.
- **Decidido:** escolha manual. No início o Rafael monta a primeira lista; os dias
  seguintes são criados copiando o dia anterior ou um modelo escolhido, e depois
  ele vai ajustando. Modelo padrão por dia da semana fica para depois, se fizer falta.

### Progresso
- Dia: itens feitos / total, em porcentagem, com barra.
- Por seção: feitos / total.
- Semana e mês: visão agregada por dia (calendário em que cada dia reflete a
  porcentagem concluída).
- **Provisório:** semana e mês usam a média das porcentagens dos dias
  (alternativa: soma de itens feitos sobre total). Pode ser trocado depois.

### Acesso
- Funciona bem no celular e no computador.
- Login com e-mail e senha. Contas criadas apenas pelo administrador (Rafael).

## Regras em vigor (implementadas)

### Modelo padrão e alcance das alterações
- O primeiro modelo criado é o **modelo principal**: é o usado por "Usar o modelo" quando não se escolhe outro e por mudanças "Sempre" em dias que não nasceram de um modelo. Dias criados de um modelo guardam a ligação (`source_id`), então "Sempre" muda o modelo certo.
- Na folha há o interruptor **"Alterações valem: Só hoje | Sempre"** (a escolha é lembrada).
  - **Só hoje:** a mudança fica só naquele dia.
  - **Sempre:** a mudança de estrutura (adicionar, renomear, descrição, remover, reordenar)
    vai também para o modelo. Dias já criados não mudam.
- **Marcar/desmarcar nunca vai para o modelo.**
- Cada seção/item do dia guarda de qual linha do modelo veio (`source_id`), para a
  mudança permanente achar o par certo.

### Criar um dia
- **Usar o modelo** (opção principal quando o modelo tem conteúdo).
- **Copiar o dia anterior** (o dia mais recente que existir antes da data).
- **Começar do zero.**
- Em qualquer cópia, tudo nasce desmarcado.

### Menu "..." do dia
- **Copiar este dia para** uma data (recusa se a data já tiver lista).
- **Salvar este dia como modelo** (substitui o modelo padrão).
- **Apagar este dia** (pede confirmação; não tem desfazer).

### Lista
- Editar título e descrição de um item (clicar no item); renomear seção (clicar no nome).
- Arrastar pela alça para reordenar itens (dentro da seção) e seções. Funciona com
  mouse, toque e teclado.
- Remover item ou seção mostra **"Desfazer"** por alguns segundos (a exclusão é
  reversível no banco: coluna `deleted_at`).
- A tela responde na hora (estado otimista) e confirma com o servidor em seguida.

### Sequência de dias
- Um dia conta quando **50% ou mais** dos itens foram feitos. Se hoje ainda não chegou
  lá, a contagem parte de ontem.

## Fora do escopo do MVP

- Horário nos itens (será avaliado quando o uso estiver consolidado).
- Tarefas esporádicas e agenda (ex.: consulta no dentista). Segunda etapa:
  uma agenda ligada à lista.
- Etiquetas, compartilhamento, finanças, notificações, painel de superadmin.

## Fases

1. **Fase 1:** só o Rafael. Conta criada por comando no servidor.
2. **Fase 2 (feita):** cadastro aberto com liberação: quem cria conta fica "aguardando liberação" e o
   administrador libera ou bloqueia em `/admin` (decisão 0003). O compartilhamento de listas ainda não existe.
3. **Fase 3 (futura):** agenda com eventos esporádicos ligada à lista.

## Pronto quando

Rafael consegue, pelo celular, abrir o dia de hoje a partir de um modelo, marcar
os itens e ver o progresso do dia; e ajustar o modelo de forma permanente
quando quiser.
