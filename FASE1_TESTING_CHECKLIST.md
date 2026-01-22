# Checklist Fase 1 - Beta Fechado

## 📋 Antes de Começar

- [ ] Execute o script SQL: `PHASE1_RLS_POLICIES.sql` no Supabase SQL Editor
- [ ] Verifique se todas as políticas RLS foram criadas com sucesso
- [ ] Limpe o cache do navegador (Ctrl+Shift+Delete)
- [ ] Desative a cache de storage se possível

## 🧪 Testes de Autenticação

### Login
- [ ] Fazer login com email/senha existentes
- [ ] Ver se redirecionado para Dashboard
- [ ] Verificar se avatar carrega corretamente
- [ ] Tentar login com credenciais inválidas (deve mostrar erro)
- [ ] Tentar login com email que não existe (deve mostrar erro)

### Signup
- [ ] Criar nova conta com email novo
- [ ] Fazer upload de foto (verificar se salva em Storage)
- [ ] Selecionar gênero (verificar se tema muda)
- [ ] Criar conta sem foto (deve usar avatar padrão)
- [ ] Tentar criar conta com email já existente (deve mostrar erro)

### Logout
- [ ] Fazer logout
- [ ] Verificar se retorna para tela de login
- [ ] Verificar se dados não ficam em localStorage

## 📊 Testes de Dashboard

- [ ] Ver 3 cards: Total Gasto, Este Mês, Cartões de Crédito
- [ ] Cards mostram valores corretos
- [ ] Cards têm cores diferentes baseado no gênero
- [ ] Gráficos carregam sem erros
- [ ] Dashboard responsivo em mobile

## 💳 Testes de Cartões de Crédito

### Adicionar Cartão
- [ ] Clique em "Cartões" no menu
- [ ] Clique em "+ Adicionar Cartão"
- [ ] Preencha todos os campos
- [ ] Clique "Adicionar Cartão"
- [ ] Verifique se cartão aparece na lista
- [ ] Tente adicionar com nome vazio (deve mostrar erro)
- [ ] Tente adicionar com limite negativo (deve mostrar erro)
- [ ] Tente adicionar com limite > 999.999,99 (deve mostrar erro)

### Deletar Cartão
- [ ] Clique no botão 🗑️ de um cartão
- [ ] Confirme a deleção
- [ ] Verifique se cartão desaparece da lista

## 💰 Testes de Despesas

### Adicionar Despesa (Dinheiro)
- [ ] Vá para "Add Despesas"
- [ ] Preencha categoria, valor, data, descrição
- [ ] Deixe "Pagar com" como "Dinheiro"
- [ ] Clique "Adicionar Despesa"
- [ ] Verifique se aparece em "Histórico de Despesas"
- [ ] Verifique se atualiza o valor em "Este Mês"

### Adicionar Despesa (Cartão)
- [ ] Vá para "Add Despesas"
- [ ] Preencha categoria, valor, data
- [ ] Selecione um cartão em "Pagar com"
- [ ] Clique "Adicionar Despesa"
- [ ] Verifique se aparece em "Histórico de Despesas"
- [ ] Vá para aba "Faturas"
- [ ] Verifique se o valor aparece na fatura do mês

### Validações de Despesa
- [ ] Tente adicionar com valor vazio (deve mostrar erro)
- [ ] Tente adicionar com valor zero (deve mostrar erro)
- [ ] Tente adicionar com valor negativo (deve mostrar erro)
- [ ] Tente adicionar com data futura (deve mostrar erro)
- [ ] Tente adicionar com descrição > 255 caracteres (deve cortar)

### Editar Despesa
- [ ] Clique no ícone de edição de uma despesa
- [ ] Modifique o valor
- [ ] Clique "Salvar"
- [ ] Verifique se foi atualizado
- [ ] Verifique se o total mudou

### Deletar Despesa
- [ ] Clique no ícone de lixeira
- [ ] Confirme deleção
- [ ] Verifique se desapareceu
- [ ] Verifique se o total foi subtraído

## 📄 Testes de Faturas

- [ ] Vá para aba "Faturas"
- [ ] Selecione um cartão que tem despesas
- [ ] Verifique se mostra o total do mês
- [ ] Verifique se mostra número de transações
- [ ] Selecione outro cartão
- [ ] Verifique se muda o total
- [ ] Selecione cartão sem despesas (deve mostrar "Nenhuma despesa")

## 🔐 Testes de Segurança (RLS)

### Isolamento de Dados
- [ ] Crie 2 contas diferentes
- [ ] Adicione despesas em cada uma
- [ ] Faça login em conta 1
- [ ] Verifique que só vê despesas da conta 1
- [ ] Faça logout e login em conta 2
- [ ] Verifique que só vê despesas da conta 2

### Validação de User ID
- [ ] Abra DevTools (F12)
- [ ] Vá para Network
- [ ] Tente adicionar uma despesa
- [ ] Verifique que `user_id` está sendo enviado
- [ ] Verifique que não há dados de outros usuários em respostas

## 📱 Testes de Responsividade

### Mobile (375px)
- [ ] Menu funciona ao clicar em ícone
- [ ] Cards ficam em 1 coluna
- [ ] Inputs têm tamanho legível
- [ ] Tabelas scrollam horizontalmente
- [ ] Buttons têm tamanho tátil (min 44px)

### Tablet (768px)
- [ ] Menu é fixo (não precisa clicar)
- [ ] Cards ficam em 2-3 colunas
- [ ] Layout funciona bem

### Desktop (1920px)
- [ ] Todos os elementos visíveis
- [ ] Sem quebra de linha desnecessária

## ⚡ Testes de Performance

- [ ] App carrega em menos de 3 segundos
- [ ] Dashboard carrega rápido mesmo com 100+ despesas
- [ ] Não há memory leaks (abra DevTools, monitore)

## 🎨 Testes de Tema

### Feminino
- [ ] Cores rosa/rose aparecem corretamente
- [ ] Avatar padrão é rosa
- [ ] Sidebar é rosa
- [ ] Cards têm cores femininas

### Masculino
- [ ] Cores slate/cinza aparecem corretamente
- [ ] Avatar padrão é cinza
- [ ] Sidebar é cinza/slate
- [ ] Cards têm cores masculinas

## 🐛 Testes de Edge Cases

- [ ] Adicionar 1000+ despesas (performance)
- [ ] Adicionar despesa com descrição muito longa (> 255 caracteres)
- [ ] Mudar gênero no perfil
- [ ] Deletar e recriar cartão com mesmo nome
- [ ] Adicionar despesa, deletar cartão, ver o que acontece
- [ ] Desconectar internet, tentar ação (deve mostrar erro apropriado)
- [ ] Desligar e ligar internet durante adição de despesa

## 📝 Testes de Erros

- [ ] Modal de erro aparece quando apropriado
- [ ] Mensagens de erro são claras
- [ ] Botão de retry funciona
- [ ] Console não tem avisos de erro (apenas info)

## ✅ Checklist Final

- [ ] Nenhum erro no console do navegador
- [ ] Todas as funcionalidades principais funcionam
- [ ] Sem memory leaks
- [ ] RLS funcionando (dados isolados)
- [ ] Performance aceitável
- [ ] Responsividade OK
- [ ] Tema visual está bom

---

## 🚀 Se Tudo Passar

Você está pronto para:
1. Convitar 5-10 usuários beta
2. Coletar feedback
3. Passar para Fase 2 (ajustes)
