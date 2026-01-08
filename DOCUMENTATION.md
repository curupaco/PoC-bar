# 🍺 Botequista - Documentação Oficial

Este documento fornece uma visão detalhada, tanto funcional quanto técnica, do sistema **Botequista**, uma solução moderna de gestão para bares e restaurantes.

---

## 📋 1. Documentação Funcional (Guia do Usuário)

O Botequista foi projetado para ser intuitivo e rápido, minimizando o tempo gasto em telas e maximizando o tempo de atendimento.

### 1.1 Gestão de Comandas (Mesa/Cliente)
- **Abertura:** Na tela inicial do PDV, utilize o botão "Abrir Nova Mesa" para iniciar um atendimento.
- **Lançamento de Itens:**
    - **Unidade:** Clique no produto para adicionar 1 unidade. Use os botões `+` e `-` na lateral da comanda para ajustar.
    - **Peso (Kg):** Ideal para porções vendidas por gramatura. O sistema abre um teclado numérico para inserir o valor em gramas.
- **Edição:** Itens de peso possuem um ícone de **lápis** para correção rápida do peso lançado.
- **Cancelamento:** É possível remover itens individuais ou "Abandonar Mesa" para cancelar toda a comanda (exige confirmação).

### 1.2 Fechamento e Pagamentos
O sistema suporta múltiplos métodos de pagamento em uma única conta (pagamento parcial):
- **CASH (Dinheiro), PIX, Débito, Crédito.**
- **Pendura:** Especial para clientes recorrentes que pagam posteriormente.
- O fechamento só é permitido quando o saldo restante for zero.

### 1.3 Insights com Inteligência Artificial
Na tela de Dashboard, o botão **"Gerar Insights"** utiliza o Google Gemini para analisar suas vendas e sugerir estratégias de lucro baseadas em dados reais, como identificar produtos parados ou sugerir combos.

### 1.4 Temas de Interface
- **Dark:** Ideal para ambientes noturnos.
- **Light:** Melhor visibilidade em ambientes claros.
- **Retro (8-bit):** Um visual nostálgico para bares temáticos.

---

## 🛠 2. Documentação Técnica (Guia do Desenvolvedor)

### 2.1 Stack Tecnológica
- **Frontend:** React 19 com TypeScript.
- **Estilização:** Tailwind CSS (Utilitários e Dark Mode nativo).
- **Gráficos:** Recharts para visualização de faturamento e top produtos.
- **IA:** `@google/genai` (SDK oficial do Google Gemini).

### 2.2 Arquitetura de Sincronização
O sistema utiliza uma estratégia **Hybrid-Storage**:
1. **LocalStorage:** Sincronização imediata para garantir que nenhum dado seja perdido se a aba for fechada ou a internet oscilar.
2. **Firebase Realtime DB:** Sincronização via REST API para persistência em nuvem e multi-dispositivos.
   - **Debounce de Salvamento:** O sistema aguarda 1.5s após a última alteração antes de enviar o pacote para a nuvem, evitando excesso de tráfego.

### 2.3 Estrutura de Dados (Tipagem)
O coração do sistema reside em `types.ts`:
- `Product`: Define o cardápio.
- `Tab`: Representa o consumo ativo.
- `Sale`: Registro imutável de uma transação finalizada.

### 2.4 Variáveis de Ambiente e Deploy
Para deploy no **Vercel** ou **GitHub Pages**, configure:
- `API_KEY`: Chave do Google AI Studio (Gemini).
- `FIREBASE_URL`: Endpoint do banco de dados (ex: `https://seu-app.firebaseio.com`).

### 2.5 Resiliência (Offline First)
O app verifica o status da conexão (`navigator.onLine`) e sinaliza na barra lateral. Se o Firebase falhar, os dados permanecem salvos localmente e tentarão sincronizar na próxima alteração bem-sucedida.

---

## 🛡 3. Segurança e Boas Práticas
- **IDs Únicos:** Gerados via `Date.now()` para evitar colisões simples em modo offline.
- **Normalização de IDs:** Todas as buscas de comanda utilizam `normalizeId` para evitar erros de espaços em branco ou tipos mistos (string/number).
- **Tratamento de Erros:** A IA possui um *fallback* (descrição padrão) caso a cota da API expire ou a chave seja inválida.

---
*Desenvolvido com foco em estética, performance e facilidade de uso.*