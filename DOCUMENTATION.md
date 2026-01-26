
# 🍺 Botequista Pro - Documentação Técnica e Operacional
**Versão:** 4.4.0 (Full Stack Definition)  
**Desenvolvedor:** Senior Frontend Engineer  
**Stack:** React 19, TypeScript, Firebase Realtime DB, TailwindCSS, Vercel Edge Functions.

---

## 1. Visão Geral
O **Botequista** é uma plataforma de gestão de PDV (Ponto de Venda) especializada para bares e restaurantes. O sistema opera em modelo **PWA (Progressive Web App)** com estratégia *Offline-First*, sincronização resiliente e arquitetura Multi-Tenant (Franquias).

---

## 2. Arquitetura de Dados & Resiliência

### A. Estrutura Multi-Tenant
- **Dados Globais:** `users/` e `units/`. Controlam autenticação e lista de franquias.
- **Dados Locais (`/units/{id}`):** Isolamento total de dados. Cada bar possui seu próprio nó de produtos, vendas e configurações.
- **Unidade Ativa:** Persistida via `localStorage` (`btq_active_unit`), permitindo que o gerente troque de bar sem relogar.

### B. Motor de Sincronização (`useSync.ts`)
- **Polling Inteligente:** Ciclos de 10s com verificação de Hash (`lastDataHash`) para evitar re-renders de UI se os dados não mudaram.
- **Fila Offline (`SyncQueue`):** Transações sem internet são armazenadas no IndexedDB e processadas sequencialmente (FIFO) com retentativas automáticas.
- **Blacklist Persistente (Anti-Zumbi):** IDs deletados são gravados localmente para impedir que a latência do servidor ressuscite itens excluídos.

### C. Protocolo de Resgate (Data Rescue)
- **Local Mirror:** O sistema mantém uma cópia completa do banco no `localStorage`.
- **Botão de Resgate:** Na tela de Ajustes, a função `handleRescueLocal` permite forçar a restauração dos dados a partir da memória do navegador caso o Firebase esteja inacessível.

---

## 3. Módulos do Sistema

### 🛒 Ponto de Venda (POS)
- **Atualização Granular:** O sistema atualiza apenas o item modificado dentro de uma mesa (patch update), reduzindo conflitos de sobrescrita.
- **Venda por Peso (KG):** Modal específico com input numérico para gramas, convertendo automaticamente para KG no cálculo de preço.
- **Split Payment:** Suporte a múltiplos métodos de pagamento em uma única venda (ex: R$ 20 Dinheiro + R$ 30 Pix).

### 📋 Gestão de Cardápio & Inventário
- **Categorias Vivas:** O sistema detecta automaticamente categorias usadas em produtos importados que não existem no cadastro oficial e sugere a importação ("Categorias Órfãs").
- **Vínculos de Adicionais (Upsell):**
  - É possível criar grupos de modificadores (ex: "Borda Recheada", "Gelo e Limão").
  - **Auto-Trigger:** Na aba "Vínculos", associa-se um Grupo a uma Categoria. Ao clicar em qualquer produto daquela categoria no PDV, o modal de adicionais abre automaticamente.
- **Favoritos:** Produtos marcados com `isFavorite` aparecem no topo do grid do PDV.

### 💰 Tesouraria e Fluxo de Caixa
- **Arquitetura de 3 Cofres:**
  1.  **Gaveta (Change):** Dinheiro rotativo do operador (trocos e recebimentos).
  2.  **Primário:** Cofre principal do gerente (Fundo fixo).
  3.  **Secundário:** Reserva ou conta bancária.
- **Auditoria de Transferências:** Toda movimentação (Sangria/Suprimento) gera um log imutável (`CashTransaction`) rastreando Origem, Destino, Usuário e Hora.
- **Fechamento Cego:** O operador informa quanto contou; o sistema calcula a diferença (Sobra/Falta) baseada nas vendas + movimentações.

---

## 4. API & Serverless Architecture

O sistema utiliza Vercel Functions para processamento pesado e segurança, evitando expor lógica de negócios no cliente.

### Segurança via Custom Headers
Para evitar expor a URL e Token do Firebase na query string, o frontend envia credenciais via headers customizados:
- `x-fb-url`: URL do Realtime Database.
- `x-fb-token`: Token de autenticação (ID Token) gerado na sessão.

### Endpoints (Vercel Functions)

1.  **`api/reports.ts`**
    *   **Função:** Gera relatórios financeiros com filtragem server-side.
    *   **Timezone Safe:** Força o offset `-03:00` (Brasília) nas queries `startAt` e `endAt` para garantir que vendas noturnas (após 21h) entrem no dia correto.
    *   **Otimização:** Retorna apenas o array filtrado, economizando banda.

2.  **`api/search.ts`** (Busca Híbrida)
    *   **Função:** Busca textual profunda no histórico de vendas.
    *   **Lógica:** Baixa os últimos 2000 registros (limite de segurança) e realiza filtragem em memória no Edge Runtime por Nome do Cliente, Mesa ou ID da Venda.

3.  **`api/feedback.ts`**
    *   **Integração GitHub:** Converte o feedback do usuário em uma **Issue** no repositório do projeto.
    *   **Labels Automáticas:** Classifica como `bug` ou `enhancement`.
    *   **Contexto:** Anexa automaticamente o usuário logado e data/hora local.

---

## 5. Segurança & Controle de Acesso (RBAC)

### Níveis de Permissão
O sistema possui 20 permissões granulares (`UserPermission`), agrupadas em:
- **Operação:** `pos`, `open_shift`, `close_shift`.
- **Financeiro:** `cash_admin`, `clear_fiado` (Baixa de Pendura).
- **Gestão:** `edit_product`, `users_admin`, `manage_units`.
- **Crítico:** `delete_sale` (Anulação auditada), `full_reset` (Reset de fábrica).

### Criptografia
- **Senhas:** Hash SHA-256 antes de salvar no banco.
- **Backups:** Suporte a criptografia AES-256 para arquivos JSON exportados (feature opcional).

---

## 6. Procedimentos de Manutenção

### Reset de Fábrica
Disponível apenas para Admin. Limpa toda a árvore de dados da unidade ativa no Firebase. Útil para inaugurações ou troca de gestão.

### Backup e Restauração
- **Exportar:** Gera um arquivo JSON contendo Vendas, Produtos, Usuários e Configurações.
- **Restaurar:** Permite carregar um JSON anterior.
- **Sync GitHub:** (Feature Experimental) Permite sincronizar o backup com um Gist privado do GitHub.

### Correção de Mesa Travada
Botão **"Forçar Limpeza"** no modal de exclusão de mesa. Adiciona o ID à blacklist local, removendo-a visualmente independente do estado do servidor.

---
*Documentação atualizada em: Outubro de 2023 (v4.4.0)*
