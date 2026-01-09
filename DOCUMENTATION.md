
# 🍺 Botequista - Documentação Oficial

Este documento fornece uma visão detalhada, tanto funcional quanto técnica, do sistema **Botequista**, a solução definitiva para gestão de bares focada em agilidade e precisão.

---

## 📋 1. Documentação Funcional (Guia do Usuário)

### 1.1 Vendas e PDV (Ponto de Venda)
- **Operação de Mesas:** Abertura rápida de comandas por nome ou número.
- **Lançamento por Peso:** Produtos configurados como "Peso (Kg)" solicitam automaticamente o valor em gramas (ex: digitar `450` para 450g), realizando o cálculo monetário instantâneo.
- **Fechamento de Conta:** Suporte a múltiplos métodos de pagamento em uma única comanda.

### 1.2 Gestão Financeira e Caixa
- **Padrão Monetário:** Rigoroso uso do padrão brasileiro (**R$ 1.234,56**) em todas as telas e comprovantes.
- **Confirmação Visual:** Entradas de valores no Caixa e Abertura de Turno possuem um preview em tempo real do valor formatado para evitar erros de digitação.
- **Tesouraria (Caixa):** Gerenciamento de três níveis de fluxo: Primário (Cofre), Gaveta (Troco/Operacional) e Secundário.

### 1.3 Relatórios Estratégicos
O sistema agora conta com 6 categorias de análise:
1.  **Fechamento:** Cupom estilo térmico para conferência de turno (exportável em PNG).
2.  **Financeiro:** Faturamento bruto, ticket médio e mix de pagamentos.
3.  **Penduras:** Gestão ativa de fiados com opção de quitação rápida.
4.  **Equipe:** Ranking de vendas por colaborador e volume de atendimentos.
5.  **Operacional:** Gráficos de fluxo horário e identificação de horários de pico.
6.  **Produtos:** Ranking de vendas (Curva ABC) para identificar itens mais rentáveis.

### 1.4 Central de Ajuda Expandida
Guia ilustrado com 6 cards cobrindo: Vendas, Nuvem, Cardápio, Equipe, Tesouraria e Dashboard.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Interface e UX
- **Material Design 3:** O botão de troca de tema segue as diretrizes Material, com ícones animados e transições suaves entre Light e Dark mode.
- **Sidebar Otimizada:** Menu lateral com alinhamento corrigido e labels simplificados (ex: "Caixa").
- **Tipografia:** Uso da fonte `Barrio` para branding e `Inter` para dados operacionais.
- **Case Sensitivity:** Interface forçada em **CAIXA ALTA** para legibilidade em ambientes escuros.

### 2.2 Tecnologias e Bibliotecas
- **Frontend:** React 19 + TypeScript.
- **Gráficos:** Recharts para visualização de dados operacionais e financeiros.
- **Exportação:** `html-to-image` para geração de cupons digitais em alta resolução.
- **IA:** Integração com o SDK `GoogleGenAI` (Gemini 3 Flash) para geração de insights de gestão.

### 2.3 Segurança e Persistência
- **Sincronização Híbrida:** Persistência primária em `localStorage` com sincronização secundária em Firebase Realtime Database.
- **Criptografia:** Dados sensíveis são criptografados com **AES-256** antes de serem enviados para a nuvem.
- **Snapshots:** Sistema de backup local para restauração imediata em caso de falha de rede.

---
*Botequista: Gestão profissional com alma de botequim.*
