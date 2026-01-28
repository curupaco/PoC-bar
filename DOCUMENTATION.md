# 🍺 Botequista Pro - Documentação Operacional
**Versão:** 3.9.5
**Stack:** React 19, Firebase RTDB, IndexedDB (Offline-First).

---

## 1. Visão Geral
O **Botequista** é um PDV (Ponto de Venda) de alta performance projetado para operação crítica de bares. O sistema foca em imutabilidade financeira, auditoria de caixa e resiliência de dados em ambientes com internet instável através de uma fila de sincronização (Sync Queue).

---

## 2. Módulos Operacionais

### A. Vendas (PDV)
- **Lançamento Rápido:** Venda direta no balcão clicando no produto e selecionando o pagamento.
- **Gestão de Mesas/Comandas:** Abertura de contas nomeadas para controle de consumo prolongado.
- **Produtos por Peso:** Teclado numérico integrado para lançamento de itens em gramas (KG).
- **Adicionais (Upsell):** Abertura automática de menus de opções (ex: Gelo e Limão) ao selecionar produtos de categorias vinculadas.
- **Descarte Seguro:** Botão de lixeira com modal de confirmação para anular mesas abertas erroneamente.

### B. Fluxo de Caixa e Turnos
- **Abertura de Turno:** Registro obrigatório de fundo de reserva (Cofre, Gaveta e Reserva).
- **Conferência Cega:** O fechamento exige que o operador conte o dinheiro físico. O sistema apura a "Quebra de Caixa" (sobra ou falta) comparando com o esperado.
- **Tesouraria:** Registro imutável de Sangrias (retirada) e Suprimentos (entrada de troco) entre compartimentos de caixa.

### C. Gestão de Penduras (Fiados)
- **Venda em Pendura:** Registro de débito vinculado ao nome do cliente.
- **Quitação Integrada:** Localizado em *Relatórios > Penduras*. 
- **Fluxo de Recebimento:** Ao clicar em "Quitar", o sistema abre um modal de valor (permitindo pagamento parcial) e redireciona automaticamente para o **Checkout do POS**. Isso garante que o pagamento seja registrado em um método real (PIX, Dinheiro, Cartão) e entre na contabilização do caixa do dia.

---

## 3. Sincronização e Resiliência
- **Sync Status:** Indicador visual no cabeçalho (Verde = Sincronizado | Amarelo = Pendente/Offline).
- **IndexedDB:** Todas as vendas feitas offline são armazenadas no navegador e enviadas à nuvem assim que a conexão é restaurada.
- **Multi-Unidade:** Isolamento estrito de dados. A troca de bar limpa o cache de memória para evitar contaminação de faturamento entre unidades.

---

## 4. Relatórios de Performance
- **Fechamento (PNG):** Gera um cupom digital completo do turno para compartilhamento ou impressão.
- **Curva ABC (Produtos):** Ranking de itens por faturamento e volume de saída.
- **Fluxo Horário:** Mapa de calor que identifica os horários de pico de atendimento.
- **Ranking da Equipe:** Volume de vendas e ticket médio por colaborador.

---

## 5. Segurança e Auditoria
- **RBAC (Permissões):** Controle granular de quem pode anular vendas, editar preços ou acessar backups.
- **Anulação Lógica:** Vendas excluídas permanecem no banco com a marca de "Excluída", registrando quem fez a ação e o horário, impedindo fraudes.

---
*Documentação atualizada conforme o estado real do sistema.*