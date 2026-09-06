# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 5.7.0 (Módulo de Drinks & Insumos Fracionados 2.0, Batches com Validade, CMV em Tempo Real e Isolamento por Bar)
**Framework:** React 19 + TypeScript + Vite
**Backend:** Firebase RTDB + Vercel Serverless Functions
**Arquitetura:** Offline-First (IndexedDB+SyncQueue)

---

## 1. Visão Geral e Arquitetura
O **Botequista** é uma solução PWA (Progressive Web App) projetada para alta disponibilidade em ambientes com conectividade instável.

### Diferenciais Técnicos
*   **Offline-First Real:** Utiliza `idb` (IndexedDB Wrapper) para persistir o estado completo da aplicação localmente.
*   **Design System & Arquitetura de Interface (v5.6.0):** Implementação de componentes base altamente desacoplados e padronizados em `src/shared/ui/` (`Button`, `Input`, `Card`, `Badge`, `Modal`, `Tabs`), substituindo CSS in-line por um sistema de design *Modern Premium & Clean* com micro-interações táteis e validação estrita TypeScript.
*   **Módulo de Drinks & Insumos Fracionados 2.0 (v5.7.0):** Central de coquetelaria completa com cálculo instantâneo de CMV, precificador dinâmico por margens alvo (60%, 70%, 80%), cadastro de insumos por embalagem/volume (garrafas -> ml e doses), produção de sub-preparos/batches com rendimento e validade refrigerada, e auditoria de perdas e quebras em R$.
*   **Isolamento Estrito por Unidade (v5.7.0):** Princípio Zero Complexidade. Bares sem o módulo ativo mantêm operação e telas 100% convencionais e enxutas.
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
*   **Registro de Perdas & Desperdício de Estoque (v5.0.0):** Rastreabilidade financeira e auditoria de descartes com preço de custo histórico e isolamento para unidades sem estoque.
*   **Módulo de Eficiência e Lançamento (v5.1.0):** Lançamento de régua de cobrança em 1-clique via WhatsApp Web, ranking reordenável de equipe por ticket médio e badge mobile reativo de unidade ativa.
*   **Previsão de Movimento por Clima & Demanda (v5.2.0):** Previsão matemática offline que cruza médias do dia da semana e geolocalização do clima local (API Open-Meteo) com simulador de clima e checklist dinâmico.
*   **Matriz de Permissionamentos Híbrida & Retrocompatível (v5.2.0):** Camada de heranças dinâmicas que concede acessos a contas legadas a partir de permissões pai, implementando controle granular individualizado (Modo Evento, ajustes/perdas de estoque, lembretes de WhatsApp, CMV/lucro bruto).
*   **Hospedaria Temporária com Alertas Customizados (v5.4.0):** Ciclos de estadia e faxina cronometrados para controle de quartos e histórico permanente.
*   **Controle de Ativação de Módulos (v5.4.0 / v5.7.0):** Permite ligar/desligar os módulos de Hospedaria e Drinks por bar, ocultando seções em tempo de execução.
*   **Recuperação de Senha Mestre do Admin (v5.4.0):** Modal de redefinição rápida com chave do banco Firebase e remapeamento do atalho de checkout de Espaço para F4.

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
*   **Identificação Móvel de Unidade (v5.1.0):** O cabeçalho em telas portáteis renderiza um badge destacado vermelho com o nome da unidade ativa, blindando garçons contra lançamentos no terminal incorreto em dias de grande movimento.

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
*   **Ranking de Equipe (v5.1.0):** Performance de vendas por atendente com seletor premium para alternar a ordenação do ranking por faturamento bruto ou ticket médio (eficiência), destacando automaticamente o *🏆 Garçom Esperto* com melhor média.
*   **Ticket Médio por Mesa (v4.7.3):** Métrica individual por mesa com comparativo percentual (ex: "+12% vs ontem").
*   **Heatmap de Fluxo:** Gráfico de densidade que identifica as horas de pico.
*   **Top Combos Vendidos (v4.5):** Descoberta automática de produtos vendidos juntos.
*   **Ranking de Produtos por Lucro (v4.7.3):** Curva ABC ordenada por lucro real, considerando CMV.
*   **Quitação de Penduras (v5.1.0):** Interface para quitar penduras em lote ou disparar uma cobrança amigável pré-formatada via WhatsApp Web com 1-clique ao lado de cada devedor.
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

### G. Controle de Perdas & Desperdício de Estoque (v5.0.0)
1.  **Lógica de Custo Histórico:** Gravação automática do preço de custo no momento exato do descarte (`LOSS`), blindando os relatórios contra flutuações futuras de custos no cadastro de produtos.
2.  **Isolamento de Segurança:** Unidades sem estoque (`useStock: false`) são isoladas e protegidas contra manipulações acidentais, ocultando seções de desperdício em tempo de execução.
3.  **Logs de Auditoria de Movimentações:** Rastreamento imutável de movimentações manuais de estoque (ENTRADA, PERDA, AJUSTE), registrando data/hora, operador responsável, produto, quantidade e categoria do descarte.
4.  **Dashboard Premium de Perdas:** Painel dedicado com KPIs de impacto financeiro no desperdício, volume descartado, impacto no CMV e análise visual por categoria.

### H. Assistente do Dono (Premium) (v5.3.0)
1.  **Resumo Financeiro Consolidado:** Métricas de faturamento consumido (excluindo taxa de serviço de 10%), custo de vendas (CMV consolidado), lucro bruto real e margem geral média do bar.
2.  **Matriz BCG de Engenharia de Cardápio:** Classificação dinâmica em quadrantes (Estrelas, Vacas Leiteiras, Quebra-Cabeças, Abacaxis) cruzando mediana de giro e média de margem de lucro. Exibe estratégias sugeridas com click-to-expand.
3.  **Lote de Custos Faltantes (CMV):** Formulário interativo para salvar em lote o preço de custo de produtos que não possuem CMV cadastrado.
4.  **Precificador de Margem Alvo:** Simulador interativo local onde o usuário insere a categoria e preço de custo (CMV) do produto, recebendo projeções de preços sugeridos para margens de 50%, 60% e 70%.
5.  **Ranking de Conversão de Upsell:** Ordenação dos garçons baseada na proporção de itens vendidos que pertencem a quadrantes de alta lucratividade (Estrelas e Quebra-Cabeças), atribuindo badges automatizados de desempenho.
6.  **Alertas Preditivos e de Auditoria:** Radar de ruptura para itens com risco de esgotar nas próximas 24h a 72h e alertas de prevenção a fraudes (comandas inativas há mais de 4h, turnos com quebra de caixa acima de 5% e operadores com excesso de cancelamentos).

### I. Hospedaria Temporária (Controle de Quartos) & Faxina (v5.4.0)
1.  **Ciclo de Estados Completo:** O quarto transita entre `AVAILABLE` (Disponível), `OCCUPIED` (Ocupado), `CLEANING` (Em Limpeza) e retorna para `AVAILABLE`.
2.  **Alertas Dinâmicos de Limite de Tempo:** Alertas visuais com pulsação amarela/vermelha no grid de quartos com base nos limites configurados de aviso de fim e próximo bloco.
3.  **Histórico de Estadias e Limpeza:** Rastreia e exibe permanentemente os registros anteriores (`RoomHistoryRecord`), medindo o faturamento da estadia, o tempo consumido no quarto e o tempo gasto pela equipe na higienização (faxina).

### J. Módulos Liga/Desliga por Unidade (v5.4.0)
1.  **Desativação em Tempo de Execução:** Chaves individuais ativam/desativam a exibição dos módulos de Hospedaria ou Drinks por bar.
2.  **Limpeza Visual e Funcional:** Oculta abas de Consignação de Eventos no Estoque, o Modo Evento/Open Bar no PDV e as configurações de receitas (Ficha Técnica) no Cardápio caso os recursos estejam desativados.

### K. Recuperação de Senha & Atalhos de Teclado (v5.4.0)
1.  **Modal "Esqueci Minha Senha":** Interface no Login que instrui colaboradores a buscar o gerente e permite ao Administrador redefinir sua senha instantaneamente para `admin123` digitando a Senha Master do Firebase.
2.  **Atalhos Seguros do PDV:** Remapeamento da tecla de checkout de `Espaço` para `F4`, evitando conflitos com inputs e seletores do sistema.

### L. Clube de Assinaturas e Recorrência (v5.5.0)
1.  **Vinculação Direta:** Integração no painel lateral de comanda do PDV pesquisável por Nome, Telefone e CPF.
2.  **Consumo e Cota de Itens:** Bloqueia automaticamente a incidência de cobrança (lançamento com valor R$ 0,00) de itens inclusos no plano ativo do associado, respeitando a cota de uso diário.
3.  **Dashboards Recorrentes (MRR):** Relatório de faturamento recorrente esperado, quantidade de associados ativos/inativos e log de consumo diário no dashboard do proprietário.

### M. Painel de Auditoria & Prevenção de Fraudes (v5.5.0)
1.  **Score de Risco por Operador:** Pontuação de risco individualizada para operadores, ponderando exclusão de comandas, remoção de itens após pré-conta impressa e quebras de caixa no fechamento de turnos.
2.  **Travamento de Auditoria de Pré-Conta:** Ao simular a impressão da pré-conta tématica no PDV, o sistema registra `billPrintedAt` e monitora qualquer manipulação posterior na comanda como suspeita.
3.  **Logs Cromáticos de Segurança:** Centralização de auditoria de segurança com alertas visuais por severidade.

### N. Central de Coquetelaria & Drinks Fracionados 2.0 (v5.7.0)
1.  **Engenharia de Cardápio com CMV ao Vivo:** Tabela analítica com cálculo em tempo real do custo da receita, CMV (%) e margem bruta por drink, categorizando cada item em Estrela (&ge;70%), Saudável (55-70%) ou Margem Baixa (&lt;55%).
2.  **Precificador de Margem Alvo Dinâmico:** No cadastro de qualquer drink com ficha técnica, o sistema sugere instantaneamente o preço ideal de venda para atingir 60%, 70% ou 80% de margem com 1 clique.
3.  **Cadastro Inteligente com Conversão de Embalagem:** Para insumos fracionados (vodka, gin, xaropes), o gestor cadastra o custo da garrafa/embalagem (ex: 750ml por R$ 85,00) e o sistema calcula automaticamente o custo fracionado por ml/g e por dose padrão de 50ml.
4.  **Sub-preparos & Ordens de Produção de Batches:** Suporte a receitas artesanais produzidas no bar (xarope de gengibre, premixes, infusões). Ao executar uma ordem de produção, os insumos base são baixados proporcionalmente, o lote entra no estoque com custo médio herdado e recebe etiqueta de validade refrigerada cronometrada.
5.  **Auditoria de Perdas e Descarte de Bar:** Interface ágil para registrar quebras de garrafas, sobras e lotes vencidos, calculando o impacto financeiro em R$ e registrando transações auditáveis de estoque.
6.  **Princípio Zero Complexidade por Bar:** Se a unidade desativa o módulo em Ajustes, a navegação de Drinks e todos os campos avançados de ficha técnica são 100% ocultados.

---

## 3. Segurança e Sincronização

### Registro de Auditoria
O sistema registra automaticamente ações críticas para evitar "perda de dados" aparente entre dispositivos.
*   **Eventos Rastreados:** `SHIFT_OPEN/CLOSE`, `TAB_OPEN/CLOSE/DELETE`, `ITEM_ADD/DELETE`, `BATCH_PRODUCTION`, `WASTE_LOG`, etc.

### Controle de Acesso (RBAC) (Híbrido & Retrocompatível v5.2.0)
*   **Camada de Herança Dinâmica:** Garante estabilidade retrocompatível total. Usuários cadastrados no banco legado herdam automaticamente os novos acessos granulares a partir de suas permissões raiz (ex: `inventory_view` e `inventory_manage` herdam de `products`, `toggle_event_mode` herda de `pos`, `view_financial_costs` herda de `dashboard`/`reports`, e `manage_debt_reminders` herda de `clear_fiado`/`reports`).
*   **Operador/Garçom:** Vendas, operação básica de mesa e Modo Evento (caso possua `pos`). Bloqueado para ajustes/perdas de estoque e dados de CMV/lucros.
*   **Gerente/Estoquista:** Acesso configurável de visualização ou controle (Modo Evento, controle e perdas de estoque, régua de cobrança).
*   **Admin:** Controle irrestrito de dados, exportação de backups, gestão de equipes, unidades e revelação do faturamento esperado.

---

## 4. Segurança de Banco de Dados
*   **Regras de Segurança RTDB:** Bloqueio de leitura e escrita global na raiz.
*   **Restrição por Identidade:** Acesso restrito via tokens de autenticação. Apenas a conta administrativa principal (`curupaco@gmail.com`) tem permissão nos nós vitais.
*   **Segurança no Cliente:** O sistema utiliza `auth.token.email` para validação no Firebase Rules, garantindo a integridade dos dados mesmo com a URL pública do banco exposta.

---

*Documentação atualizada em Setembro de 2026. Botequista System v5.7.0*