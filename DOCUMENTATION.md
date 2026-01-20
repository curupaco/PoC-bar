
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.33 (2026)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 📋 Visão Geral do Sistema

O **Botequista** é uma aplicação web progressiva (PWA) focada na gestão ágil de bares e restaurantes de alto giro. O sistema prioriza velocidade operacional, integridade financeira e facilidade de uso em dispositivos móveis e desktops.

---

## 🏗️ Módulos Principais

### 1. Ponto de Venda (PDV)
- **Mesas e Comandas:** Abertura e fechamento de múltiplas mesas simultâneas.
- **Lançamento Rápido:** Interface otimizada para toque, com busca instantânea e favoritos.
- **Produtos Pesáveis:** Suporte para venda por quilo (KG) com modal de entrada de peso em gramas.
- **Modificadores:** Sistema de adicionais e observações (ex: "Sem Gelo", "Com Limão") vinculados a produtos ou categorias.
- **Atalho de Quitação:** Função de "Venda Rápida" para clientes que não ocupam mesas.

### 2. Gestão de Produtos (Cardápio)
- **Cadastro Simplificado:** Focado apenas em **Nome**, **Preço de Venda** e **Categoria**.
- **Categorização:** Organização automática por grupos (Cervejas, Destilados, Porções).
- **Vínculos Inteligentes:** Associação automática de menus de opções (Modificadores) a categorias inteiras.

### 3. Controle Financeiro e Turnos
- **Turnos de Trabalho:** Abertura e fechamento de caixa com controle de operador.
- **Fundos de Caixa:** Gestão de Fundo Principal, Gaveta (Troco) e Reserva.
- **Auditoria de Fechamento:** Comparativo entre o valor esperado pelo sistema e a contagem física (cega) do operador.
- **Sangrias e Suprimentos:** Registro de movimentação interna de valores entre compartimentos de caixa.

### 4. Relatórios e Análise
- **Fechamento de Turno:** Geração de cupom visual (PNG) com resumo da operação para prestação de contas.
- **Financeiro:** Faturamento bruto detalhado por método de pagamento (Pix, Crédito, Débito, Dinheiro).
- **Operacional:** Gráfico de fluxo horário para identificar picos de atendimento.
- **Equipe:** Ranking de vendas por colaborador.
- **Penduras (Fiados):** Gestão completa de contas a receber, com controle de limite de crédito global e baixa de pagamentos.

---

## 🔐 Segurança e Dados

### Autenticação e Permissões
- **Login Local:** Sistema de usuários com senhas hash (SHA-256).
- **RBAC (Role-Based Access Control):** Controle granular de permissões (ex: apenas Gerente pode excluir vendas ou ver relatórios).

### Sincronização em Nuvem
- **Backend:** Firebase Realtime Database.
- **Modo Offline:** O sistema carrega com dados locais em caso de falha de rede e tenta sincronizar em segundo plano.
- **Concorrência:** Tratamento de edições simultâneas em mesas diferentes via atualização otimista.

### Auditoria
- **Logs de Exclusão:** Vendas excluídas ("anuladas") não somem do banco; são marcadas logicamente (`deleted: true`) e registradas com o usuário responsável e timestamp, aparecendo em relatórios de auditoria.

---

## ⚙️ Regras de Negócio Importantes

1.  **Imutabilidade de Vendas Fechadas:** Uma venda finalizada não pode ser alterada, apenas anulada (com permissão) e relançada.
2.  **Integridade de Estoque/Cardápio:** A exclusão de um produto ou grupo de modificadores aciona uma varredura nas mesas abertas para evitar erros de referência (item fantasma).
3.  **Pendura Obrigatório:** O método de pagamento "Pendura" exige, obrigatoriamente, o nome do cliente.
4.  **Troco Dinâmico:** O sistema calcula o troco sugerido apenas para pagamentos em Dinheiro, baseado no valor entregue.

---

*Documentação gerada automaticamente para conformidade com o padrão Botequista Pro.*
