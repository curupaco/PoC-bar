# 🍺 Botequista Pro - Documentação Operacional
**Versão:** 3.9.x
**Stack:** React 19, Firebase RTDB, IndexedDB (Offline-First), Vercel Serverless Functions.

---

## 1. Visão Geral
O **Botequista** é um sistema de gestão para bares focado em agilidade operacional e integridade financeira. Sua arquitetura **Offline-First** permite que o bar continue vendendo mesmo sem internet, sincronizando os dados automaticamente quando a conexão retorna.

---

## 2. Módulos Operacionais

### A. Vendas (PDV)
- **Lançamento Rápido:** Interface otimizada para toque, com "Favoritos" e busca instantânea.
- **Gestão de Mesas:** Abertura e controle de contas por nome ou número.
- **Pagamento Múltiplo:** Suporte para dividir uma conta em vários métodos (ex: parte em Dinheiro, parte no PIX).
- **Produtos por Peso:** Modal dedicado com teclado numérico para lançar itens em gramas (KG).
- **Carrinho Mobile:** Interface adaptativa que transforma o PDV em uma lista expansível em telas pequenas.

### B. Gestão de Cardápio & Upsell
- **Categorias e Produtos:** CRUD completo com marcação de favoritos.
- **Grupos de Adicionais:** Criação de menus de opções (ex: "Gelo e Limão", "Borda Recheada").
- **Vínculos Automáticos:** Configuração de gatilhos onde selecionar uma categoria (ex: "Whiskys") abre automaticamente o modal de adicionais correspondente.

### C. Fluxo de Caixa e Turnos
- **Monitor de Turno:** Painel em tempo real com faturamento bruto, tickets e volume de itens.
- **Conferência Cega:** O operador deve contar o dinheiro físico ao fechar. O sistema calcula a diferença (Quebra de Caixa) apenas após a contagem.
- **Exportação de Fechamento:** Geração de imagem (PNG) do relatório final para envio via WhatsApp/E-mail.

### D. Tesouraria Visual (Novo)
- **Interface Gráfica:** Representação visual dos compartimentos: **Gaveta Operacional**, **Cofre Principal** e **Reserva**.
- **Operações ATM:** Teclado numérico estilo caixa eletrônico para realizar:
    - **Sangrias:** Retirada de excesso da gaveta para o cofre.
    - **Suprimentos:** Entrada de troco do cofre para a gaveta.
    - **Recolhimento:** Movimentação da reserva.
- **Auditoria:** Log imutável de todas as transferências com timestamp e usuário responsável.

### E. Gestão de Penduras (Fiados)
- **Carteira de Devedores:** Listagem de clientes com saldo devedor.
- **Quitação Integrada:** O recebimento de uma dívida redireciona para o checkout do PDV, garantindo que o dinheiro entre no caixa do turno atual (contabilizado como receita financeira, não venda de produto).

---

## 3. Infraestrutura e Inteligência

### A. Sincronização e Dados
- **Fila de Sincronização (SyncQueue):** Vendas feitas offline são enfileiradas e enviadas sequencialmente ao Firebase.
- **Busca Híbrida:** O histórico de vendas utiliza uma estratégia dupla:
    1. **Local:** Para dados recentes e performance instantânea.
    2. **Cloud (API):** Para buscar vendas antigas no servidor sem pesar o navegador.
- **Multi-Unidade:** Suporte nativo para redes de bares (Franquias), com isolamento total de dados entre unidades.

### B. Relatórios Gerenciais
- **Financeiro:** Quebra por método de pagamento e Ticket Médio.
- **Curva ABC:** Ranking de produtos por faturamento e volume de saída.
- **Mapa Operacional:** Gráfico de calor (Heatmap) mostrando os horários de pico de atendimento.
- **Performance de Equipe:** Ranking de vendas por colaborador.

### C. Manutenção e Suporte
- **Feedback System:** Modal integrado para reportar bugs ou sugerir melhorias diretamente para o GitHub Issues.
- **Health Check:** Diagnóstico em tempo real da conexão com API, Banco de Dados e Latência.
- **Backup & Restore (JSON):**
    - **Exportação:** Geração de arquivo JSON via `Blob` e `URL.createObjectURL` contendo snapshot completo do estado (Produtos, Vendas, Usuários, Configurações).
    - **Importação:** Leitura de arquivo via `FileReader` com restauração de estado e persistência imediata no Firebase + IndexedDB.
    - **Resgate Local:** Recuperação de dados via `localStorage` (Mirror) em caso de falha crítica de rede ou cache.

---

## 4. Segurança e Permissões (RBAC)
O sistema possui um controle granular de acesso dividido em perfis:
- **Operação:** Acesso ao PDV e Abertura de Turno.
- **Gerência:** Acesso a Relatórios, Cancelamento de Vendas e Edição de Produtos.
- **Administração:** Acesso total, incluindo Gestão de Unidades, Backups e Reset de Sistema.

---
*Documentação gerada automaticamente pelo Botequista System.*