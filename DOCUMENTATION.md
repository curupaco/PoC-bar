
# 🍺 Botequista - Documentação Oficial

Este documento fornece uma visão detalhada, tanto funcional quanto técnica, do sistema **Botequista**, uma solução moderna e completa de gestão para bares e restaurantes.

---

## 📋 1. Documentação Funcional (Guia do Usuário)

O Botequista foi projetado para ser intuitivo e rápido, focado na agilidade do atendimento de balcão e mesa.

### 1.1 Gestão de Comandas (Mesa/Cliente)
- **Abertura:** Na tela de **Venda (PDV)**, utilize "Abrir Nova Mesa".
- **Lançamento de Itens:**
    - **Unidade:** Clique no produto para adicionar. Use `+` e `-` para ajustes finos.
    - **Peso (Kg):** Para itens vendidos por gramatura, o sistema abre um teclado numérico.
- **Cancelamento:** Permite remover itens individuais ou "Abandonar Mesa" (limpa o consumo sem gerar venda).

### 1.2 Métodos de Pagamento e Penduras
O sistema suporta pagamentos parciais (dividir a conta):
- **CASH (Dinheiro), PIX, Débito, Crédito.**
- **Pendura (Fiado):** Registra o valor como uma dívida vinculada ao nome do cliente.
- **Quitação:** Para pagar uma dívida, o sistema gera uma venda especial de "Quitação" que abate o saldo devedor do cliente no relatório.

### 1.3 Relatórios Inteligentes
O módulo de **Relatórios** foi expandido para oferecer controle total:
- **Fechamento de Turno:** Um "cupom digital" detalhado com faturamento, conferência de gaveta (esperado vs. real) e produtos mais vendidos no período. Possui seletor de turnos anteriores e botão para exportar como imagem (PNG).
- **Penduras:** Lista em tempo real todos os clientes que possuem saldo devedor, com botão de "Quitação Rápida" que preenche o PDV automaticamente.
- **Financeiro e Equipe:** Gráficos de faturamento por método, ticket médio e performance de vendas por colaborador.

### 1.4 Insights com Inteligência Artificial
Na dashboard, o Gemini analisa o mix de produtos e faturamento para sugerir 3 dicas estratégicas para aumentar a lucratividade do bar.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Stack Tecnológica
- **Frontend:** React 19 + TypeScript.
- **Estilização:** Tailwind CSS com suporte a Temas (Light, Dark, Retro).
- **Gráficos:** Recharts para visualizações analíticas.
- **Exportação:** `html-to-image` para geração de comprovantes de fechamento.
- **IA:** `@google/genai` (Google Gemini 3 Flash).

### 2.2 Arquitetura de Sincronização e Segurança
- **Cloud Sync:** Integração com Firebase Realtime DB via REST.
- **Criptografia AES:** Todos os dados (vendas, produtos, usuários) são criptografados com a biblioteca `crypto-js` antes de serem enviados para a nuvem, utilizando uma chave mestra.
- **Snapshot de Segurança:** Na tela de Ajustes, o usuário pode criar um "Ponto de Restauração" local (LocalStorage) antes de realizar operações críticas.

### 2.3 Gestão de Turnos
- O sistema bloqueia vendas se não houver um turno ativo.
- O turno registra: Operador de abertura/fechamento, Fundo de troco inicial e Sangrias/Suprimentos via Tesouraria.

---

## 🛡 3. Segurança e Boas Práticas
- **Permissões Granulares:** Usuários podem ser limitados a apenas "Vender" ou ter acesso "Admin" (Relatórios, Ajustes, Gestão de Usuários).
- **Resiliência Offline:** O sistema prioriza o cache local e tenta sincronizar com o Firebase em background assim que detecta conectividade.

---
*Botequista: O braço direito do dono de bar.*
