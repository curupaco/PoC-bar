
# 🍺 Botequista - Documentação Oficial

Este documento fornece uma visão detalhada, tanto funcional quanto técnica, do sistema **Botequista**, uma solução moderna e completa de gestão para bares e restaurantes.

---

## 📋 1. Documentação Funcional (Guia do Usuário)

O Botequista foi projetado para ser intuitivo e rápido, focado na agilidade do atendimento de balcão e mesa.

### 1.1 Gestão de Comandas (Mesa/Cliente)
- **Abertura:** Na tela de **Venda (PDV)**, utilize "Abrir Nova Mesa".
- **Lançamento de Itens:**
    - **Unidade:** Clique no produto para adicionar. Use `+` e `-` para ajustes finos.
    - **Peso (Kg):** Para itens vendidos por gramatura, o sistema abre um teclado numérico para entrada em gramas (g). O cálculo é automático com base no preço/kg.
- **Cancelamento:** Permite remover itens individuais ou "Abandonar Mesa" (limpa o consumo sem gerar venda).

### 1.2 Cadastro de Produtos (Novo Fluxo)
- **Modal Centralizado:** A edição e o cadastro agora abrem um modal fixo no centro da tela, garantindo que o usuário não perca o contexto, mesmo em listas longas.
- **Normalização de Categoria:** O sistema limpa automaticamente nomes de categoria em caixa alta. Exemplos: "CACHETA" vira "Cacheta".

### 1.3 Padrão Monetário e Pagamentos
- **Moeda:** O sistema utiliza rigorosamente o padrão brasileiro (**R$ 1.234,56**).
- **Métodos Suportados:** CASH (Dinheiro), PIX, Débito, Crédito e Pendura.
- **Pendura (Fiado):** Registra o valor como uma dívida vinculada ao nome do cliente.
- **Quitação:** Para pagar uma dívida, acesse Relatórios > Penduras e clique em Quitar. Isso envia o comando para o PDV para recebimento formal.

### 1.4 Relatório de Fechamento (Estilo Cupom Fiscal)
O módulo de **Relatórios** conta com um design de alta fidelidade para conferência:
- **Visual Retrô/Térmico:** O relatório de fechamento simula uma impressora térmica com bordas serrilhadas (zigzag) no topo e na base.
- **Exportação:** Permite gerar uma imagem PNG perfeita do cupom para compartilhamento via WhatsApp.
- **Conferência de Gaveta:** Calcula automaticamente o "Dinheiro Esperado" somando o Fundo de Troco inicial às vendas em espécie do turno.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Stack Tecnológica
- **Frontend:** React 19 + TypeScript.
- **Estilização:** Tailwind CSS.
- **Banco de Dados:** Firebase Realtime Database (REST).
- **IA:** Integração com Google Gemini para análise de ticket médio e sugestões de lucro.

### 2.2 UI/UX e Arquitetura
- **Modais Fixed-Viewport:** Implementados com `fixed inset-0` e `z-index: 100` para garantir visibilidade total sobre listas scrollables.
- **Bloqueio de Scroll:** O `document.body.style.overflow` é alterado para `hidden` durante a exibição de modais para evitar "scroll fantasma".
- **Limpeza de Dados (Sanitization):** Funções de mapeamento garantem que inconsistências de string (como categorias legadas em caps lock) sejam corrigidas no tempo de execução e no salvamento.

### 2.3 Sincronização e Segurança
- **Criptografia:** AES-256 (Crypto-JS) protege o payload antes do envio para o Firebase.
- **Modo Offline:** O sistema utiliza `localStorage` como buffer. Dados são sincronizados assim que a conexão é restabelecida.

---
*Botequista: O braço direito do dono de bar.*
