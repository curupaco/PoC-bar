
# 🍺 Botequista - Documentação Oficial

Este documento fornece uma visão detalhada, tanto funcional quanto técnica, do sistema **Botequista**, uma solução moderna e completa de gestão para bares e restaurantes.

---

## 📋 1. Documentação Funcional (Guia do Usuário)

O Botequista foi projetado para ser intuitivo e rápido, focado na agilidade do atendimento de balcão e mesa.

### 1.1 Gestão de Comandas (Mesa/Cliente)
- **Abertura:** Na tela de **Venda (PDV)**, utilize "Abrir Nova Mesa".
- **Lançamento de Itens:**
    - **Unidade:** Clique no produto para adicionar. Use `+` e `-` para ajustes finos.
    - **Peso (Kg):** Para itens vendidos por gramatura, o sistema abre um teclado numérico para entrada em gramas (g).
- **Cancelamento:** Permite remover itens individuais ou "Abandonar Mesa" (limpa o consumo sem gerar venda).

### 1.2 Padrão Monetário e Pagamentos
- **Moeda:** O sistema utiliza rigorosamente o padrão brasileiro (**R$ 1.234,56**).
- **Métodos Suportados:** CASH (Dinheiro), PIX, Débito, Crédito e Pendura.
- **Pendura (Fiado):** Registra o valor como uma dívida vinculada ao nome do cliente.
- **Quitação Corrigida:** Para pagar uma dívida, o sistema gera uma venda especial de "Quitação". Agora, o sistema detecta automaticamente pagamentos parciais ou totais e abate o valor exato do saldo devedor do cliente no relatório.

### 1.3 Relatório de Fechamento (Estilo Cupom Fiscal)
O módulo de **Relatórios** conta com um design de alta fidelidade para conferência:
- **Visual Retrô/Térmico:** O relatório de fechamento simula uma impressora térmica com bordas serrilhadas (zigzag) no topo e na base.
- **Exportação:** Permite gerar uma imagem PNG perfeita do cupom para compartilhamento via WhatsApp ou impressão, com correção de enquadramento para evitar cortes.
- **Conferência de Gaveta:** Calcula automaticamente o "Dinheiro Esperado" somando o Fundo de Troco inicial às vendas em espécie do turno.

### 1.4 Usuários Padrão
- **Admin:** Acesso total a todas as funções.
- **Ozzy:** Usuário padrão para operação de vendas e visualização de histórico.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Stack Tecnológica
- **Frontend:** React 19 + TypeScript.
- **Estilização:** Tailwind CSS com classes dinâmicas para suporte a temas (Light, Dark, Retro).
- **Efeitos CSS:** Gradientes lineares avançados para simular o corte serrilhado de papel.
- **Exportação:** `html-to-image` configurado com `pixelRatio: 2` para alta definição.

### 2.2 UI/UX e Acessibilidade
- **Custom Scrollbars:** Barras de rolagem personalizadas e visíveis em desktops para garantir navegação fluida em telas com muito conteúdo.
- **Layout Fixo no PDV:** O botão de finalização de venda é fixado no rodapé da barra lateral para garantir acessibilidade em qualquer resolução de tela, evitando que o scroll esconda a ação principal.
- **Scrollbar Gutter:** Utilização de `scrollbar-gutter: stable` para evitar saltos de layout (layout shift) durante a navegação.

### 2.3 Sincronização e Segurança
- **Firebase:** Integração via REST API com persistência em tempo real.
- **Criptografia:** AES-256 para proteção de dados sensíveis na nuvem.
- **Snapshot Local:** Permite criar pontos de restauração no `localStorage` antes de operações de reset ou importação.

---
*Botequista: O braço direito do dono de bar.*
