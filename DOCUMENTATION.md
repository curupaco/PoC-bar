
# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.0.2 (Stable)  
**Stack:** React 19, TypeScript, Firebase RTDB, TailwindCSS, Vercel Functions

---

## 1. Arquitetura Multi-Unidade (Franquia)
O sistema opera em modo Multi-Tenant lógico. Os dados são segregados por unidade, mas compartilham a mesma base de usuários e configurações globais.

### Estrutura de Dados (Firebase)
- **`users/`**: Base global de colaboradores. Um usuário pode ter acesso a múltiplas unidades (`allowedUnits`).
- **`units/`**: Cadastro global de bares (ID, Nome, Status).
- **`data/units/{unit_id}/`**: Dados isolados de cada bar:
  - `products`: Cardápio específico da unidade.
  - `sales`: Histórico de vendas.
  - `openTabs`: Mesas abertas.
  - `shifts`: Turnos de caixa.
  - `modifierGroups`: Adicionais e complementos.

---

## 2. Cardápio Inteligente & Upsell
O sistema de produtos possui três camadas de complexidade para agilizar o atendimento:

### A. Tipos de Venda
- **Unidade:** Venda padrão (Cervejas, Latas).
- **Peso (KG):** Aciona automaticamente o modal de pesagem (input em gramas -> conversão para KG) no PDV.

### B. Modificadores (Adicionais)
Grupos de opções que podem ser vinculados a produtos.
- *Exemplo:* Grupo "Borda" (Catupiry +R$2,00, Cheddar +R$3,00).

### C. Vínculos de Categoria (Automação)
É possível vincular uma **Categoria Inteira** a um **Grupo de Modificadores**.
- *Comportamento:* Ao clicar em qualquer produto da categoria "DOSES", o sistema abre automaticamente o modal perguntando "Gelo e Limão?".

---

## 3. Controle de Acesso (RBAC)
O sistema de permissões foi migrado de "Papéis Fixos" para "Lista de Controle de Acesso" (ACL).

- **Admin:** Acesso total.
- **Gerente:** Gestão de equipe, turnos e anulações.
- **Caixa/Operador:** Vendas e fluxo de caixa básico.

---

## 4. Fluxo de Caixa (Tesouraria)
O modelo financeiro segue o padrão de **Fechamento Cego** para evitar fraudes.
1. **Abertura:** Declaração de fundos.
2. **Operação:** Vendas somam ao teórico.
3. **Movimentações:** Sangrias e Suprimentos ajustam o saldo da gaveta.
4. **Fechamento:** Operador conta o físico; sistema calcula a quebra.

---

## 5. Auditoria e Anulação
- **Exclusão Lógica (`soft delete`):** Vendas deletadas recebem a flag `deleted: true` e permanecem no banco para auditoria.

---

## 6. Sincronização (Offline-First)
O hook `useSync` gerencia a consistência dos dados com o Firebase.
- **Fila de Sincronização (`SyncQueue`):** Garante que dados gerados offline sejam enviados assim que a conexão retornar.

---

## 7. Integrações Externas (Feedback System)
O sistema possui uma API Serverless (`api/feedback.ts`) hospedada na Vercel que permite aos usuários reportar bugs ou sugerir features diretamente do app.

### Fluxo de Dados
1. Usuário preenche o formulário no modal de Feedback.
2. O Frontend envia POST para `/api/feedback`.
3. A Vercel Function autentica com o GitHub e cria uma **Issue** no repositório do projeto.

### Requisitos de Configuração (Variáveis de Ambiente)
Para que o sistema de feedback funcione em produção, as seguintes variáveis devem ser configuradas no painel da Vercel:

| Variável | Descrição |
| :--- | :--- |
| `GITHUB_TOKEN` | Personal Access Token (Classic) com escopo `repo`. |
| `GITHUB_OWNER` | Nome do usuário ou organização dona do repositório (ex: `curupaco`). |
| `GITHUB_REPO` | Nome do repositório onde as issues serão criadas (ex: `PoC-bar`). |

> **Nota:** Em ambiente local (`localhost`), a API route pode não estar disponível a menos que esteja rodando via `vercel dev`. O frontend possui um mock automático para evitar travamentos durante o desenvolvimento local.

---

## 8. Protocolo de Suporte
- **Feedback:** O botão de balão no topo abre a modal de feedback.
- **Logs:** Erros de API são logados no console com prefixo `[Sync]` ou `[Feedback API]`.
