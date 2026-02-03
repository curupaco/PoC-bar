# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 3.9.6 (Express Update)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB + SyncQueue)

---

## 1. Visão Geral e Arquitetura
O **Botequista** é uma solução PWA (Progressive Web App) projetada para alta disponibilidade em ambientes com conectividade instável.

### Diferenciais Técnicos
*   **Offline-First Real:** Utiliza `idb` (IndexedDB Wrapper) para persistir o estado completo da aplicação localmente.
*   **Venda Expressa (Novo):** Fluxo otimizado para giro de balcão com auto-geração de comandas e restrições de pagamento para agilidade operacional.
*   **Deduplicação de Categorias:** O frontend aplica normalização estrita (Trim + UpperCase) ao agregar categorias.

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV) & Venda Expressa
*   **Fluxo Convencional:** Abertura manual de mesa, acompanhamento de longo prazo e pagamentos parciais/múltiplos.
*   **Venda Expressa (⚡):** 
    *   Criação instantânea de comanda com nome aleatório (ex: `EXPRESSA #A1B2`).
    *   **Bloqueio de Pendura:** Vendas rápidas não permitem o método "Pendura", garantindo recebimento imediato.
    *   **Pagamento Único:** A interface de checkout é simplificada para apenas uma forma de pagamento, forçando a agilidade no balcão.
    *   **Conversão:** Caso o cliente mude de ideia, uma venda expressa pode ser renomeada para uma mesa fixa a qualquer momento.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Aba Vínculos:** Ligação automática de categorias a grupos de adicionais.
4.  **Aba Categorias:** Gestão de taxonomia.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado fisicamente sem saber o esperado.
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos via teclado numérico dedicado.

### D. Relatórios e Inteligência
*   **Fechamento de Turno:** Gera comprovante digital em PNG.
*   **Curva ABC:** Identifica produtos "Carro-Chefe".
*   **Carteira de Penduras:** Gestão de dívidas e quitação automática.

---

## 3. Segurança e Infraestrutura

### Controle de Acesso (RBAC)
*   **Operador:** Vendas, Venda Expressa e Abertura de Turno.
*   **Gerente:** Cancelamento de Vendas, Fechamento de Caixa, Edição de Cardápio.
*   **Admin:** Gestão de Unidades e Backups.

---
*Documentação gerada pelo Botequista System v3.9.6*