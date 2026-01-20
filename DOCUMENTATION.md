
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.40 (2026)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 📋 Visão Geral do Sistema

O **Botequista** é uma aplicação web progressiva (PWA) focada na gestão ágil de bares e restaurantes de alto giro. O sistema prioriza velocidade operacional, integridade financeira e facilidade de uso em dispositivos móveis e desktops.

---

## 🔐 Matriz de Autoridade (RBAC)

O sistema utiliza Controle de Acesso Baseado em Funções (RBAC) granular, dividido em 4 esferas de competência:

### 1. Visibilidade de Módulos (Navegação)
Define quais abas da Sidebar o usuário pode visualizar e acessar. 
- **Exemplos:** `pos` (Vendas), `history` (Histórico), `reports` (Relatórios).

### 2. Controle de Fluxo (Gestão de Turno)
Define quem tem autoridade para iniciar e encerrar a jornada financeira.
- **Exemplos:** `open_shift`, `close_shift`, `clear_fiado`.

### 3. Autoridade de Inventário
Define quem pode alterar a estrutura de vendas do estabelecimento.
- **Exemplos:** `edit_product`, `delete_product`.

### 4. Segurança e Auditoria Crítica
Privilégios de alto nível que permitem a alteração de dados históricos e exportação de informações sensíveis.
- **Exemplos:** `delete_sale` (Anular Venda), `manage_backup` (GitHub Sync), `full_reset`.

---

## 🏗️ Módulos Operacionais

### 1. Ponto de Venda (PDV)
- **Mesas e Comandas:** Abertura e fechamento de múltiplas mesas simultâneas.
- **Lançamento Rápido:** Interface otimizada para toque, com busca instantânea e favoritos.
- **Produtos Pesáveis:** Suporte para venda por quilo (KG) com modal de entrada de peso em gramas.
- **Modificadores:** Sistema de adicionais e observações vinculados a produtos ou categorias.

### 2. Gestão de Cardápio
- **Cadastro Simplificado:** Focado apenas em **Nome**, **Preço de Venda** e **Categoria**.
- **Categorização:** Organização automática por grupos (Cervejas, Destilados, Porções).
- **Vínculos Inteligentes:** Associação automática de menus de opções (Modificadores) a categorias.

### 3. Controle Financeiro e Turnos
- **Turnos de Trabalho:** Abertura e fechamento de caixa com controle de operador.
- **Fundos de Caixa:** Gestão de Fundo Principal, Gaveta (Troco) e Reserva.
- **Auditoria de Fechamento:** Comparativo entre o valor esperado pelo sistema e a contagem física (cega) do operador.

---

## ⚙️ Regras de Negócio Importantes

1.  **Imutabilidade de Vendas Fechadas:** Uma venda finalizada não pode ser alterada, apenas anulada (exige permissão `delete_sale`) e relançada.
2.  **Exclusão Lógica:** Vendas anuladas não somem do banco; são marcadas como `deleted: true` para auditoria posterior do gestor.
3.  **Segurança Offline:** Em caso de falha de conexão, o sistema utiliza o cache local do navegador para autenticação (baseado no último backup sincronizado).
4.  **Troco Dinâmico:** O cálculo de troco é sugerido automaticamente apenas para o método "Dinheiro".

---

*Documentação atualizada em conformidade com o padrão Botequista Pro v3.9.*
