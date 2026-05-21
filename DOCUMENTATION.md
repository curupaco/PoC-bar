# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.9.5 (Kitchen Monitor & Realtime Alerts)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB+SyncQueue)

---

## 1. Visão Geral e Arquitetura
O **Botequista** é uma solução PWA (Progressive Web App) projetada para alta disponibilidade em ambientes com conectividade instável.

### Diferenciais Técnicos
*   **Offline-First Real:** Utiliza `idb` (IndexedDB Wrapper) para persistir o estado completo da aplicação localmente.
*   **Venda Expressa:** Fluxo otimizado para giro de balcão com auto-geração de comandas.
*   **Registro de Auditoria:** Rastreabilidade de eventos críticos para resolução de conflitos de sincronia.
*   **Segurança de Saída:** Guardas de navegação (`beforeunload`) que impedem o fechamento se houver dados pendentes na sincronização.
*   **Monitor de Cozinha com Alertas Globais (v4.9.5):** Painel do cozinheiro sincronizado em tempo real, gerando avisos sonoros (Web Audio API Bell Chime) e visuais (Toasts) automáticos para toda a equipe conectada quando pratos ficam prontos.
*   **Controle de Estoque Inteligente:** Sistema híbrido que permite definir quais produtos devem descontar estoque e quais são serviços puros.
*   **Acessibilidade Nativa (v4.7):** Implementação de `aria-labels` descritivos e associação semântica de labels/inputs em todos os módulos críticos.
*   **Segurança de Credenciais (v4.7):** Remoção de exibição de senhas em texto puro e proteção de contas administrativas.
*   **Segurança de Acesso (v4.7.3):** Bloqueio de edição de login admin e confirmação de logout para evitar erros operacionais.
*   **Engenharia de Cardápio (v4.7.3):** Cadastro de CMV (Custo de Mercadoria Vendida) e cálculo automático de Lucro Real por item.
*   **Módulo de Gratificação (v4.7.3):** Taxa de serviço configurável (padrão 10%) com cálculo automático.
*   **Cardápio Digital QR Elite (v4.8.0):** Rota dinâmica `/menu/BAR_NAME` com busca inteligente por slug. Suporte a temas Claro/Escuro.
*   **Happy Hour Automático (v4.8.1):** Transição de preços automatizada com badges promocionais.
*   **Radar de Prejuízo (v4.9.0):** Varredura automática em tempo real que cruza CMV e vendas semanais para apontar itens com margens abaixo de 30%.
*   **Smart Stock Híbrido (v4.9.0):** Alertas de estoque preditivos para itens controlados (ETA de esgotamento) e modo **Alta Demanda (Hot Item)** para produtos sem estoque.

---

## 2. Módulos Operacionais

### A. Terminal de Vendas (PDV) & Velocidade
*   **Fluxo Convencional:** Abertura manual de mesa, acompanhamento e pagamentos múltiplos.
*   **Venda Expressa (⚡):** Criação instantânea de comanda com nome aleatório.
*   **Atalhos de Teclado (v4.3):** Suporte nativo a `F1` (Venda Rápida), `F2` (Nova Mesa), `ESC` (Voltar) e `Espaço` (Checkout).
*   **Botão Saideira (v4.3):** Permite repetir instantaneamente os últimos itens adicionados à mesa com um clique.
*   **Sinalização de Mesa Ociosa (v4.3):** Alertas visuais cromáticos (Amarelo/Vermelho) para mesas sem consumo há mais de 30 minutos.
*   **Detector de Mesa Travada (v4.4):** Monitoramento em tempo real do tempo desde o último pedido, com alertas de pulso vermelho.
*   **Mesa com Itens Prontos (v4.9.5):** O card da mesa pisca com um ícone de sino animado (🛎️) quando a cozinha marca algum prato como pronto, facilitando a retirada imediata pelo garçom.

### B. Gestão de Inventário
1.  **Aba Produtos:** Listagem com busca global e edição rápida.
2.  **Aba Adicionais:** Criação de grupos de modificadores.
3.  **Rastreio de Estoque (v4.2):** Botão "Controlar Estoque" por item.
4.  **Curva ABC Avançada (v4.3):** Novo filtro que permite alternar o ranking de produtos entre **Volume de Saída** (popularidade) e **Faturamento Bruto** (lucratividade).
5.  **Detector de Produto Morto (v4.4.1):** Algoritmo híbrido que identifica itens com estoque sem giro nos últimos 15 dias.
6.  **Smart Stock Intelligence (v4.6):** Módulo de predição de ruptura baseado em velocidade de venda e sugestão de reposição com exportação para WhatsApp.
7.  **Enviar para a Cozinha (v4.9.5):** Interruptor ("toggle") no cadastro do produto para selecionar quais itens entram no fluxo de produção da cozinha.

### C. Tesouraria e Fluxo de Caixa
*   **Conferência Cega (Blind Close):** O operador informa o valor contado sem ver os números do sistema. 
*   **Interface ATM:** Lançamento de Sangrias e Suprimentos com teclado dedicado.
*   **Auto-Backup (v4.3):** O sistema sugere a geração de um backup `.json` automático imediatamente após o fechamento de cada turno.

### D. Relatórios e Inteligência
*   **Ranking de Equipe:** Performance de vendas por atendente.
*   **Ticket Médio por Mesa (v4.7.3):** Métrica individual por mesa com comparativo percentual (ex: "+12% vs ontem").
*   **Heatmap de Fluxo:** Gráfico de densidade que identifica as horas de pico.
*   **Top Combos Vendidos (v4.5):** Descoberta automática de produtos vendidos juntos.
*   **Ranking de Produtos por Lucro (v4.7.3):** Curva ABC ordenada por lucro real, considerando CMV.
*   **Quitação em Lote:** Interface para selecionar múltiplos devedores e quitar penduras de uma só vez.
*   **Resumo Diário Automático (v4.7.3):** Consolida e envia o faturamento para o WhatsApp do dono ao fechar turno.

### E. Operações & Cliente
*   **QR Code da Mesa (v4.7.3):** Gera QR code para cada mesa que o cliente pode escanear e visualizar a conta.
*   **Cardápio Digital QR Elite (v4.8.0):** Menu público em `/menu/UNIDADE` com suporte a temas e ocultação inteligente de itens esgotados.

### F. Monitor de Produção (Cozinha) (v4.9.5)
1.  **Fila de Preparo (PENDING):** Agrupa pratos de comandas ativas por tempo de espera (FIFO). Alertas cromáticos de atraso piscam em 10 minutos (Amarelo) e 20 minutos (Vermelho).
2.  **Totais Consolidados:** Exibe o total acumulado de itens a serem feitos (ex: "5x Heineken") para produção em massa ágil.
3.  **Aba Prontos & Histórico (READY):** Exibe itens finalizados com atalho rápido para desfazer.
4.  **Comandas Fechadas (Fechada 🔒):** Mantém tickets fechados visíveis para a cozinha por até 2h (limite de 15 vendas) com travas de segurança (cadeado) que impedem a modificação de status em contas liquidadas.
5.  **Campainha e Alertas Globais (Ding! 🛎️):** Toca som físico sintetizado via Web Audio API e envia Toasts ("*Pedido pronto! Mesa X*") de forma coordenada para todos os dispositivos logados simultaneamente ao concluir pratos, sem dependência de internet ou arquivos locais.
6.  **Proteção contra Sobrecarga:** Um guard do React Ref impede que a sincronização inicial de dados dispare múltiplos sons ao carregar a página.

---

## 3. Segurança e Sincronização

### Registro de Auditoria
O sistema registra automaticamente ações críticas para evitar "perda de dados" aparente entre dispositivos.
*   **Eventos Rastreados:** `SHIFT_OPEN/CLOSE`, `TAB_OPEN/CLOSE/DELETE`, `ITEM_ADD/DELETE`, etc.

### Controle de Acesso (RBAC)
*   **Operador/Garçom:** Vendas e operação básica de mesa.
*   **Gerente:** Cancelamentos, Fechamento (Modo Cego) e Auditoria.
*   **Admin:** Gestão de Unidades, Backups e Revelação de Valores.

---

## 4. Segurança de Banco de Dados
*   **Regras de Segurança RTDB:** Bloqueio de leitura e escrita global na raiz.
*   **Restrição por Identidade:** Acesso restrito via tokens de autenticação. Apenas a conta administrativa principal (`curupaco@gmail.com`) tem permissão nos nós vitais.
*   **Segurança no Cliente:** O sistema utiliza `auth.token.email` para validação no Firebase Rules, garantindo a integridade dos dados mesmo com a URL pública do banco exposta.

---

*Documentação atualizada em Maio de 2026. Botequista System v4.9.5*