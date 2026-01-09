
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

### 1.2 Cadastro de Produtos e Interface
- **Modal Centralizado:** A edição e o cadastro agora abrem um modal fixo no centro da tela.
- **Visual:** O sistema utiliza rigorosamente **CAIXA ALTA** em nomes de produtos e categorias para garantir a máxima legibilidade em ambientes de baixa luminosidade ou telas pequenas.

### 1.3 Padrão Monetário e Pagamentos
- **Moeda:** O sistema utiliza o padrão brasileiro (**R$ 1.234,56**).
- **Pendura (Fiado):** Registra o valor como uma dívida vinculada ao nome do cliente.
- **Quitação:** Para pagar uma dívida, acesse Relatórios > Penduras e clique em Quitar. Isso envia o comando para o PDV para recebimento formal.

### 1.4 Tesouraria e Turnos
- **Segregação de Caixa:** O dinheiro é dividido entre Primário (Cofre), Gaveta (Troco) e Secundário.
- **Fechamento:** O relatório de fechamento simula uma impressora térmica com bordas serrilhadas e pode ser exportado como imagem PNG.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Stack Tecnológica
- **Frontend:** React 19 + TypeScript.
- **Estilização:** Tailwind CSS (com suporte a Temas Light/Dark).
- **Banco de Dados:** Firebase Realtime Database (via fetch REST).
- **Criptografia:** AES-256 via CryptoJS para segurança dos dados em trânsito.

### 2.2 UI/UX e Arquitetura
- **Sincronização:** Os dados são salvos localmente no `localStorage` e sincronizados de forma assíncrona com o Firebase via `useEffect` debounced.
- **Environment:** O sistema utiliza `process.env.FIREBASE_URL` para facilitar o deploy no Vercel/GitHub.

### 2.3 Gestão de Usuários
- **Permissões Granulares:** Cada usuário possui um array de `UserPermission` que define quais botões e telas estão visíveis.
- **Admin:** O usuário `admin` possui acesso garantido à visualização de ajuda (`help_view`).

---
*Botequista: O braço direito do dono de bar.*
