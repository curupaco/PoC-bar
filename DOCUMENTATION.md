
# 🍺 Botequista - Manual de Gestão e Operação

O Botequista é um sistema profissional para gestão de bares e botecos, focado em **agilidade no atendimento**, **segurança financeira** e **controle total de estoque e caixa**.

---

## 🚀 1. Gestão de Dados e Segurança

O sistema opera com um motor de sincronização em tempo real para que você possa usar vários aparelhos ao mesmo tempo no bar.

### 1.1 Persistência e Criptografia
- **Segurança Máxima**: Seus dados são criptografados antes de serem enviados para a nuvem. Somente quem possui a Senha Master do seu bar pode ler as informações.
- **Sincronização Ativa**: O sistema verifica mudanças na nuvem a cada 30 segundos. Se outro aparelho salvar dados novos, você verá um aviso de sincronização no topo da tela.

### 1.2 Controle de Versão (Obrigatório)
- **Trava de Obsolecência**: Para evitar que operadores usem versões antigas (que podem causar conflitos de mesas abertas), o sistema exige a atualização sempre que uma nova versão crítica é lançada. Se vir a tela de "Atualização Obrigatória", apenas recarregue a página.

---

## 💻 2. Compatibilidade e Acesso

### 2.1 Navegadores Suportados
- **Google Chrome**: Recomendado.
- **Microsoft Edge**: 100% Compatível (Baseado em Chromium). O Edge oferece excelente desempenho nos relatórios gráficos e na gestão de tesouraria.
- **Safari (iOS)**: Totalmente funcional em iPhones e iPads.

### 2.2 Offline e PWA
- O Botequista pode ser instalado como um aplicativo (PWA). No Android (Chrome) ou Windows (Edge/Chrome), clique em "Instalar Aplicativo" no menu do navegador para ter o ícone na sua tela inicial.

---

## 🛠 3. Cadastro de Cardápio (Produtos)

O pilar do seu bar é o cadastro correto de itens e preços.

### 3.1 Cadastro de Itens
- **Nome e Preço**: Cada produto deve ter um nome comercial claro e um preço de venda definido.
- **Venda por Peso**: Ideal para porções ou refeições. O sistema calcula o valor baseado no peso em gramas informado no PDV.

---

## 💰 4. Ponto de Venda (PDV) e Regras de Caixa

O PDV foi desenhado para ser operado sob pressão e com rapidez.

### 4.1 Operação de Mesas
- Você pode abrir mesas ilimitadas. 
- **Sincronia de Mesas**: Graças ao polling ativo, se você abrir uma mesa no seu celular, ela aparecerá no tablet do bar em instantes.

### 4.2 Gestão de Turnos
- O sistema trabalha com o conceito de "Turnos Operacionais". 
- Um turno registra quem abriu o caixa, com quanto dinheiro começou e quanto dinheiro terminou após a conferência.

---

## 📊 5. Relatórios e Controle Financeiro

Acompanhe a saúde do seu bar através de dados consolidados.

### 5.1 Controle de Fiados (Penduras)
- O sistema mantém um histórico rigoroso de devedores. Para lançar um fiado, a identificação do cliente é obrigatória.
- O saldo devedor é calculado de forma histórica, considerando todas as compras e todos os pagamentos já realizados pelo cliente.

---

## 👤 6. Gestão de Equipe

Crie usuários específicos para seus garçons e gerentes:
- **Administradores**: Acesso total às configurações e limpeza de dados.
- **Operadores**: Acesso apenas para realizar vendas e gerenciar mesas.

---
**Botequista - Versão Profissional**
*Gestão de Bar Eficiente, Segura e Sem Complicações.*
