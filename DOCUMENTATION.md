# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.9.0 (AI Insights & Margin Intelligence)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB+SyncQueue)

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
*   **Segurança de Acesso (v4.7.3):** Bloqueio de edição de login admin e confirmação de logout para evitar erros operacionais.
*   **Legibilidade Aprimorada (v4.7.3):** Reajuste de contraste e tamanhos de fonte em todo o Dashboard e PDV.
*   **Engenharia de Cardápio (v4.7.3):** Suporte a cadastro de CMV (Custo de Mercadoria Vendida) e cálculo automático de Lucro Real por item e por período.
*   **Módulo de Gratificação (v4.7.3):** Implementação de taxa de serviço configurável por unidade (padrão 10%) com cálculo automático no fechamento da conta.
*   **Cardápio Digital QR Elite (v4.8.0):** Nova rota dinâmica `/menu/BAR_NAME` com busca inteligente por slug. Suporte nativo a temas Claro/Escuro (Escuro como padrão).
*   **Acesso Rápido ao Menu (v4.8.0):** Atalhos visuais no cadastro de bares e no dashboard para acesso imediato ao link público do cardápio.
*   **Modo Evento (v4.8.1):** Trava o PDV em fluxo de vendas expressas contínuas, ideal para baladas e dias de pico.
*   **Happy Hour Automático (v4.8.1):** Transição de preços automatizada baseada no relógio do sistema, com badges visuais.
*   **Confirmação Visual de Pagamento (v4.8.1):** Indicador de "Pagamento Completo" para garantir o fechamento seguro de contas e zerar o saldo devedor de forma óbvia.
*   **Radar de Prejuízo (v4.9.0):** Varredura automática em tempo real que cruza CMV e vendas semanais para apontar itens com margens abaixo de 30% e alta rotatividade.
*   **Smart Stock Híbrido (v4.9.0):** Alertas de estoque preditivos para itens controlados (ETA de esgotamento) e modo **Alta Demanda (Hot Item)** inteligente para produtos/bars sem estoque.
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
*   **QR Code da Mesa (v4.7.3):** Gera QR code para cada mesa que o cliente pode escanear e visualizar a conta ou realizar pagamento.
*   **Modo Happy Hour Automático (v4.8.1):** Sistema altera automaticamente os preços dos produtos conforme configuração de horário, com badges visuais indicando promoção ativa.
*   **Modo Evento (v4.8.1):** Trava o PDV em modo de venda expressa contínua, ignorando mesas. Ideal para eventos, baladas e dias de pico intenso.
*   **Confirmação Visual de Pagamento (v4.8.1):** Indicador "PAGAMENTO COMPLETO ✓" exibido quando o saldo da conta é zerado, evitando fechamentos prematuros.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Rastreio de Estoque (v4.2):** Botão "Controlar Estoque" por item.
4.  **Curva ABC Avançada (v4.3):** Novo filtro que permite alternar o ranking de produtos entre **Volume de Saída** (popularidade) e **Faturamento Bruto** (lucratividade).
5.  **Detector de Produto Morto (v4.4.1):** Algoritmo híbrido que identifica itens com estoque sem giro ou produtos de cardápio esquecidos (sem vendas nos últimos 15 dias).
6.  **Smart Stock Intelligence (v4.6):** Módulo de predição de ruptura baseado em velocidade de venda em tempo real e sugestão de reposição automatizada com exportação para WhatsApp.
7.  **UX de Cadastro (v4.7.1):** Bloqueio de preço zero e nomes duplicados para garantir integridade do cardápio.
8.  **Produtos Esgotados no PDV (v4.7.1):** Itens sem estoque aparecem com opacidade reduzida e badge "ESGOTADO" visível, apenas se o controle de estoque estiver ativo.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado sem ver os números do sistema. 
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos.
*   **Auto-Backup (v4.3):** O sistema solicita a geração de um backup `.json` automático imediatamente após o fechamento de cada turno.

### D. Relatórios e Inteligência (v4.4 Intelli-Bar)
*   **Ranking de Equipe:** Visualização em barras da performance de vendas por atendente.
*   **Ticket Médio Inteligente (v4.4):** Comparação automática com períodos anteriores para identificação de tendências de consumo.
*   **Ticket Médio por Mesa (v4.7.3):** Métrica individual por mesa com comparativo percentual (ex: "+12% vs ontem").
*   **Heatmap de Fluxo:** Gráfico de densidade que identifica as horas de pico de movimento do estabelecimento.
*   **Top Combos Vendidos (v4.5):** Algoritmo de descoberta automática que identifica pares de produtos vendidos juntos com maior frequência no período.
*   **Ranking de Produtos por Lucro (v4.7.3):** Curva ABC que considera CMV para ordenação por lucro real, não apenas faturamento.
*   **Quitação em Lote:** Interface para selecionar múltiplos devedores e processar a quitação totalizada de uma só vez.
*   **Comprovante Digital via WhatsApp:** Geração de recibos em texto formatado para envio direto via Web Share API para o smartphone do cliente.
*   **Resumo Diário Automático (v4.7.3):** Gera relatório consolidado ao fechar turno e envia automaticamente para o WhatsApp do proprietário, contendo: faturamento total, ticket médio, mesas atendidas, produto mais vendido e garçom destaque.
*   **Relatório de Lucro Real (v4.7.3):** Nova métrica de rentabilidade líquida que subtrai os custos cadastrados do faturamento bruto.
*   **Pool de Gorjetas (v4.7.3):** Relatório consolidado da taxa de serviço arrecadada para rateio transparente entre a equipe.

### E. Operações & Cliente
*   **QR Code da Mesa (v4.7.3):** Gera QR code para cada mesa que o cliente pode escanear e visualizar a conta ou realizar pagamento.
*   **Resumo Diário Automático via WhatsApp (v4.7.3):** Ao fechar o turno, o sistema envia automaticamente um resumo para o WhatsApp do proprietário com: faturamento total, ticket médio, total de mesas, produto mais vendido e garçom destaque.
*   **Cardápio Digital com Sincronização (v4.7.3):** Rota `/menu/UNIDADE` que exibe o cardápio em tempo real. Itens sem estoque não aparecem automaticamente.

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
*Documentação atualizada em Maio de 2026. Botequista System v4.8.1*