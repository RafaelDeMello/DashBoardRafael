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

## Fora do escopo do MVP

- Horário nos itens (será avaliado quando o uso estiver consolidado).
- Tarefas esporádicas e agenda (ex.: consulta no dentista). Segunda etapa:
  uma agenda ligada à lista.
- Etiquetas, compartilhamento, finanças, notificações, painel de superadmin.

## Fases

1. **Fase 1:** só o Rafael. Conta criada por comando no servidor, sem tela de cadastro.
2. **Fase 2:** painel para convidar/aprovar outras pessoas (esposa e demais).
3. **Fase 3 (futura):** agenda com eventos esporádicos ligada à lista.

## Pronto quando

Rafael consegue, pelo celular, abrir o dia de hoje a partir de um modelo, marcar
os itens e ver o progresso do dia; e ajustar o modelo de forma permanente
quando quiser.
