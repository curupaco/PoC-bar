# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.3.0 (Elite Powerhouse Update)
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
*   **Arquitetura de Rede (Novo):** Suporte nativo a multi-unidades e franquias com isolamento estrito de dados via `franchiseId`.
*   **Controle de Estoque Inteligente (Novo):** Sistema híbrido que permite definir quais produtos devem descontar estoque e quais são serviços puros.
*   **Deduplicação de Categorias:** O frontend aplica normalização estrita (Trim + UpperCase) ao agregar categorias.

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV) & Velocidade
*   **Fluxo Convencional:** Abertura manual de mesa, acompanhamento de longo prazo e pagamentos parciais/múltiplos.
*   **Venda Expressa (⚡):** Criação instantânea de comanda com nome aleatório.
*   **Atalhos de Teclado (v4.3):** Suporte nativo a `F1` (Venda Rápida), `F2` (Nova Mesa), `ESC` (Voltar) e `Espaço` (Checkout).
*   **Botão Saideira (v4.3):** Permite repetir instantaneamente os últimos itens adicionados à mesa com um clique.
*   **Sinalização de Mesa Ociosa (v4.3):** Alertas visuais cromáticos (Amarelo/Vermelho) para mesas sem consumo há mais de 30 minutos.
*   **Alertas de Estoque Crítico (v4.3):** Badges visuais nos botões de produtos quando o estoque está abaixo do limite de segurança.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Rastreio de Estoque (v4.2):** Botão "Controlar Estoque" por item.
4.  **Curva ABC Avançada (v4.3):** Novo filtro que permite alternar o ranking de produtos entre **Volume de Saída** (popularidade) e **Faturamento Bruto** (lucratividade).

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado sem ver os números do sistema. 
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos.
*   **Auto-Backup (v4.3):** O sistema solicita a geração de um backup `.json` automático imediatamente após o fechamento de cada turno.

### D. Relatórios e Inteligência (v4.3 Elite)
*   **Ranking de Equipe:** Visualização em barras da performance de vendas por atendente.
*   **Heatmap de Fluxo:** Gráfico de densidade que identifica as horas de pico de movimento do estabelecimento.
*   **Quitação em Lote:** Interface para selecionar múltiplos devedores e processar a quitação totalizada de uma só vez.
*   **Comprovante Digital via WhatsApp:** Geração de recibos em texto formatado para envio direto via Web Share API para o smartphone do cliente.

---

## 3. Segurança e Sincronização

### Registro de Auditoria (Auditoria de Eventos)
O sistema registra automaticamente ações críticas para evitar "perda de dados" aparente entre dispositivos.
*   **Eventos Rastreados:** `SHIFT_OPEN/CLOSE`, `TAB_OPEN/CLOSE/DELETE`, `ITEM_ADD/DELETE`, etc.

### Controle de Acesso (RBAC)
*   **Operador/Garçom:** Vendas e operação básica de mesa.
*   **Gerente:** Cancelamentos, Fechamento (Modo Cego) e Auditoria.
*   **Admin:** Gestão de Unidades, Backups e Revelação de Valores.

---
*Documentação atualizada em Abril de 2026. Botequista System v4.3.0*