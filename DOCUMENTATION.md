# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 3.9.5 (Stable Release)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB + SyncQueue)

---

## 1. Visão Geral e Arquitetura
O **Botequista** é uma solução PWA (Progressive Web App) projetada para alta disponibilidade em ambientes com conectividade instável.

### Diferenciais Técnicos
*   **Offline-First Real:** Utiliza `idb` (IndexedDB Wrapper) para persistir o estado completo da aplicação localmente. O sistema opera 100% sem internet.
*   **Safe Storage Wrapper:** Implementação de uma camada de abstração sobre o `localStorage` para prevenir "White Screens of Death" em navegadores com bloqueio de cookies ou Modo Anônimo estrito (comum em iOS e Samsung Internet).
*   **Sincronização Híbrida:**
    *   **Escrita:** Fila FIFO (`SyncQueue`) com retry exponencial para garantir que nenhuma venda seja perdida.
    *   **Leitura:** Estratégia "Stale-While-Revalidate" para dados recentes e busca via Cloud Function para histórico profundo (> 2000 registros).
    *   **Deduplicação de Categorias:** O frontend aplica normalização estrita (Trim + UpperCase) ao agregar categorias vindas de produtos e da lista oficial para evitar duplicatas visuais causadas por erros de digitação (ex: "Bebidas" vs "BEBIDAS ").

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV)
*   **Interface Adaptativa:** Layout de grid responsivo que se transforma em uma lista com "Drawer" lateral em dispositivos móveis.
*   **Fluxo de Venda:**
    1.  **Seleção:** Busca instantânea (fuzzy search) ou navegação por categorias.
    2.  **Modificadores:** Detecção automática de produtos pesáveis (modal de gramas) ou com adicionais obrigatórios (modal de upsell).
    3.  **Checkout:** Painel de pagamentos múltiplos (ex: R$ 50 no Pix + R$ 20 em Dinheiro com cálculo de troco automático).
*   **Atalhos de Sistema:** Quitação de fiado redireciona para o PDV como um item especial (`quitacao`) para correta entrada no caixa do dia.

### B. Gestão de Inventário (Novo Layout em Abas)
A tela de cadastro foi refatorada para suportar grandes catálogos:
1.  **Aba Produtos:** Listagem com busca global, filtros de categoria colapsáveis e edição rápida de preço/nome.
2.  **Aba Adicionais:** Criação de grupos de modificadores (ex: "Borda", "Tipo de Gelo").
3.  **Aba Vínculos:** Interface matricial para ligar Categorias inteiras a Grupos de Adicionais (ex: Toda "Dose" abre o menu "Gelos").
4.  **Aba Categorias:** Gestão de taxonomia e importação de categorias órfãs.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado fisicamente sem saber o esperado pelo sistema. O cálculo de sobra/falta é exibido apenas após a confirmação.
*   **Interface ATM:** Teclado numérico grande para lançamento de Sangrias (Retirada) e Suprimentos (Entrada de Troco).
*   **Auditoria Visual:** Cards distintos para "Gaveta Operacional" (Dinheiro Vivo) e "Cofre" (Acumulado), com timeline de transferências.

### D. Relatórios e Inteligência
*   **Fechamento de Turno:** Gera um "Comprovante Digital" (PNG via `html-to-image`) com resumo financeiro, performance por categoria e auditoria de caixa.
*   **Curva ABC:** Identifica os produtos "Carro-Chefe" (Volume) vs "Estrela" (Faturamento).
*   **Heatmap Operacional:** Gráfico de barras indicando os horários de pico de atendimento para dimensionamento de equipe.
*   **Carteira de Penduras:** Listagem de saldos devedores com botão de ação rápida para quitação parcial ou total.

---

## 3. Segurança e Infraestrutura

### Controle de Acesso (RBAC)
O sistema implementa permissões granulares validadas tanto no Frontend (UI) quanto nas Regras de Segurança do Database:
*   **Operador:** Apenas Vendas e Abertura de Turno.
*   **Gerente:** Cancelamento de Vendas, Fechamento de Caixa, Edição de Produtos.
*   **Admin:** Gestão de Unidades, Backups, Reset Geral.

### Gestão de Unidades (Franquia)
*   **Isolamento de Dados:** Cada unidade possui um nó exclusivo no Firebase (`/data/units/{unitId}`).
*   **Troca Rápida:** Usuários com permissão multi-unidade podem alternar entre bares sem relogar.

### Recuperação de Desastres
1.  **Nuvem (Principal):** Sincronização automática com Firebase.
2.  **Backup JSON:** Exportação manual completa do banco de dados.
3.  **Resgate Local (Emergency):** Ferramenta na aba "Ajustes" que tenta recuperar dados do cache do navegador caso a conexão com a nuvem seja perdida permanentemente e o usuário limpe o cache de rede mas não o armazenamento local.

---

## 4. Stack Tecnológico & Patterns

*   **Frontend:** React 19 (`useMemo` intensivo para performance), Tailwind CSS (Estilização Utility-First).
*   **Charts:** Recharts para visualização de dados.
*   **Criptografia:** `crypto-js` (AES) para dados sensíveis em repouso localmente.
*   **API Layer:** Next.js / Vercel Functions para operações pesadas (Busca Histórica, Consolidação de Relatórios).

---
*Documentação gerada pelo Botequista System v3.9.5*