# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.1.0 (Reliability & Blind Mode Update)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB + SyncQueue)

---

## 1. Visão Geral e Arquitetura
O **Botequista** é uma solução PWA (Progressive Web App) projetada para alta disponibilidade em ambientes com conectividade instável.

### Diferenciais Técnicos
*   **Offline-First Real:** Utiliza `idb` (IndexedDB Wrapper) para persistir o estado completo da aplicação localmente.
*   **Venda Expressa:** Fluxo otimizado para giro de balcão com auto-geração de comandas.
*   **Registro de Auditoria:** Sistema de rastreabilidade de eventos críticos para resolução de conflitos de sincronia.
*   **Segurança de Saída (Novo):** Guardas de navegação (`beforeunload`) que impedem o fechamento da aba se houver dados pendentes na fila de sincronização.
*   **Deduplicação de Categorias:** O frontend aplica normalização estrita (Trim + UpperCase) ao agregar categorias.

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV) & Venda Expressa
*   **Fluxo Convencional:** Abertura manual de mesa, acompanhamento de longo prazo e pagamentos parciais/múltiplos.
*   **Venda Expressa (⚡):** 
    *   Criação instantânea de comanda com nome aleatório (ex: `EXPRESSA #A1B2`).
    *   **Bloqueio de Pendura:** Vendas rápidas não permitem o método "Pendura", garantindo recebimento imediato.
    *   **Pagamento Único:** Checkout simplificado para apenas uma forma de pagamento.
    *   **Conversão:** Uma venda expressa pode ser renomeada para uma mesa fixa a qualquer momento.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Aba Vínculos:** Ligação automática de categorias a grupos de adicionais.
4.  **Aba Categorias:** Gestão de taxonomia profissional.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado sem ver os números do sistema (ocultos por padrão). Apenas usuários `admin` podem revelar os valores antes do fechamento.
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos via teclado numérico dedicado.

### D. Relatórios e Inteligência
*   **Fechamento de Turno:** Gera comprovante digital em PNG.
*   **Curva ABC:** Identifica produtos "Carro-Chefe" para otimização de estoque.
*   **Carteira de Penduras:** Gestão de dívidas e quitação automática.
*   **Registro de Auditoria (Timeline):** Registro cronológico de ações sensíveis (abertura de turno, deleção de itens, fechamento de mesas).

---

## 3. Segurança e Sincronização

### Registro de Auditoria (Auditoria de Eventos)
O sistema registra automaticamente ações críticas para evitar "perda de dados" aparente entre dispositivos.
*   **Retenção:** Dados mantidos por 7 dias para análise de discrepâncias.
*   **Eventos Rastreados:** 
    *   `SHIFT_OPEN` / `SHIFT_CLOSE`
    *   `TAB_OPEN` / `TAB_CLOSE` / `TAB_DELETE`
    *   `ITEM_ADD` / `ITEM_DELETE`
    *   Controles de Sincronia.

### Controle de Acesso (RBAC)
*   **Operador:** Vendas, Venda Expressa e Abertura de Turno.
*   **Gerente:** Cancelamento de Vendas, Fechamento de Caixa (Modo Cego), Edição de Cardápio e **Visualização de Auditoria**.
*   **Admin:** Gestão de Unidades, Backups, Permissões totais e **Revelação de Valores em Tempo Real** no fechamento.

### Sincronização (Firebase Sync)
Utiliza uma camada intermediária de `useSync` para garantir que mudanças feitos em um tablet reflitam instantaneamente no smartphone do dono. Em caso de conflito, a última alteração válida no banco de dados prevalece, com log de auditoria disparado em caso de deleções.

---
*Documentação atualizada em Março de 2026. Botequista System v4.0.0*