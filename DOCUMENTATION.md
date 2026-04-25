# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.7.1 (UX Polishing & Operational Safety)
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
*   **Acessibilidade Nativa (v4.7):** Implementação de `aria-labels` descritivos e associação semântica de labels/inputs em todos os módulos críticos.
*   **Segurança de Credenciais (v4.7):** Remoção de exibição de senhas em texto puro e proteção reforçada de contas administrativas.
*   **Deduplicação e Validação (v4.7.1):** O frontend aplica normalização estrita (Trim + UpperCase) e impede o cadastro de produtos duplicados ou com preço zerado.
*   **Feedback Visual Aprimorado (v4.7.1):** Sistema de notificações (Toasts) com duração estendida (6s) e semântica de cores (Verde para sucesso, Vermelho para erro).

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV) & Velocidade
*   **Fluxo Convencional:** Abertura manual de mesa, acompanhamento de longo prazo e pagamentos parciais/múltiplos.
*   **Venda Expressa (⚡):** Criação instantânea de comanda com nome aleatório.
*   **Atalhos de Teclado (v4.3):** Suporte nativo a `F1` (Venda Rápida), `F2` (Nova Mesa), `ESC` (Voltar) e `Espaço` (Checkout).
*   **Botão Saideira (v4.3):** Permite repetir instantaneamente os últimos itens adicionados à mesa com um clique.
*   **Sinalização de Mesa Ociosa (v4.3):** Alertas visuais cromáticos (Amarelo/Vermelho) para mesas sem consumo há mais de 30 minutos.
*   **Detector de Mesa Travada (v4.4):** Monitoramento em tempo real do tempo desde o último pedido, com alertas de pulso vermelho e sugestões de "Saideira" automáticas.
*   **Tempo de Mesa (v4.4):** Contador de tempo real exibido em cada comanda aberta para controle de giro do salão.
*   **Alertas de Estoque Crítico (v4.3):** Badges visuais nos botões de produtos quando o estoque está abaixo do limite de segurança.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Rastreio de Estoque (v4.2):** Botão "Controlar Estoque" por item.
4.  **Curva ABC Avançada (v4.3):** Novo filtro que permite alternar o ranking de produtos entre **Volume de Saída** (popularidade) e **Faturamento Bruto** (lucratividade).
5.  **Detector de Produto Morto (v4.4.1):** Algoritmo híbrido que identifica itens com estoque sem giro ou produtos de cardápio esquecidos (sem vendas nos últimos 15 dias).
6.  **Smart Stock Intelligence (v4.6):** Módulo de predição de ruptura baseado em velocidade de venda em tempo real e sugestão de reposição automatizada com exportação para WhatsApp.
7.  **UX de Cadastro (v4.7.1):** Bloqueio de preço zero e nomes duplicados para garantir integridade do cardápio.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado sem ver os números do sistema. 
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos.
*   **Auto-Backup (v4.3):** O sistema solicita a geração de um backup `.json` automático imediatamente após o fechamento de cada turno.

### D. Relatórios e Inteligência (v4.4 Intelli-Bar)
*   **Ranking de Equipe:** Visualização em barras da performance de vendas por atendente.
*   **Ticket Médio Inteligente (v4.4):** Comparação automática com períodos anteriores para identificação de tendências de consumo.
*   **Heatmap de Fluxo:** Gráfico de densidade que identifica as horas de pico de movimento do estabelecimento.
*   **Top Combos Vendidos (v4.5):** Algoritmo de descoberta automática que identifica pares de produtos vendidos juntos com maior frequência no período.
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

## 4. Segurança de Banco de Dados (v4.5)
*   **Regras de Segurança RTDB:** O banco de dados utiliza regras de acesso estritas no Firebase Realtime Database que bloqueiam a leitura e escrita global na raiz.
*   **Restrição por Identidade:** Acesso restrito via tokens de autenticação. Apenas a conta administrativa principal (`curupaco@gmail.com`) tem permissão para operar nos nós vitais: `users`, `units`, `franchises` e `data/units/*`.
*   **Proteção de Estrutura:** A raiz do banco (`/`) está protegida contra listagem, o que impede que o endereço do banco de dados seja usado por terceiros para mapear a estrutura de dados.
*   **Segurança no Cliente:** O sistema utiliza `auth.token.email` para validação no lado do servidor (Firebase Rules), garantindo que mesmo que a URL do banco seja conhecida, apenas o usuário autorizado consiga transacionar dados.

---
*Documentação atualizada em Abril de 2026. Botequista System v4.7.1*