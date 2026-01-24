
# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.0.1 (Multi-Bar Stable)  
**Stack:** React 19, TypeScript, Firebase RTDB, TailwindCSS

---

## 1. Arquitetura Multi-Unidade (Franquia)
O sistema agora opera em modo Multi-Tenant lógico. Os dados são segregados por unidade, mas compartilham a mesma base de usuários e configurações globais.

### Estrutura de Dados (Firebase)
- **`users/`**: Base global de colaboradores. Um usuário pode ter acesso a múltiplas unidades (`allowedUnits`).
- **`units/`**: Cadastro global de bares (ID, Nome, Status).
- **`data/units/{unit_id}/`**: Dados isolados de cada bar:
  - `products`: Cardápio específico da unidade.
  - `sales`: Histórico de vendas.
  - `openTabs`: Mesas abertas.
  - `shifts`: Turnos de caixa.
  - `modifierGroups`: Adicionais e complementos.

### Lógica de Acesso (Roteamento)
1. **Login:** O sistema autentica o usuário.
2. **Seleção:**
   - Se o usuário tem acesso a **apenas 1 unidade**, o sistema faz o *bypass* e entra direto (Impacto Zero na UX).
   - Se tem acesso a **múltiplas** (ou é Admin), exibe a tela "Onde vamos trabalhar hoje?".
3. **Contexto:** O `activeUnitId` é persistido no `localStorage` e injetado em todas as chamadas do hook `useSync`.

---

## 2. Cardápio Inteligente & Upsell
O sistema de produtos possui três camadas de complexidade para agilizar o atendimento:

### A. Tipos de Venda
- **Unidade:** Venda padrão (Cervejas, Latas).
- **Peso (KG):** Aciona automaticamente o modal de pesagem (input em gramas -> conversão para KG) no PDV. Ideal para buffets e porções.

### B. Modificadores (Adicionais)
Grupos de opções que podem ser vinculados a produtos.
- *Exemplo:* Grupo "Borda" (Catupiry +R$2,00, Cheddar +R$3,00).
- Os modificadores podem ser cobrados ou gratuitos.

### C. Vínculos de Categoria (Automação)
É possível vincular uma **Categoria Inteira** a um **Grupo de Modificadores**.
- *Comportamento:* Ao clicar em qualquer produto da categoria "DOSES", o sistema abre automaticamente o modal perguntando "Gelo e Limão?".
- *Configuração:* Aba `Cardápio > Vínculos`.

---

## 3. Controle de Acesso (RBAC)
O sistema de permissões foi migrado de "Papéis Fixos" para "Lista de Controle de Acesso" (ACL).

### Níveis Críticos
1. **Admin (God Mode):** Acesso total irrestrito. Pode criar unidades e resetar o sistema.
2. **Gerente:** Pode ter permissões de `users_admin`, `shifts_admin` e `delete_sale` (Anulação).
3. **Caixa/Operador:** Geralmente restrito a `pos`, `open_shift`, `close_shift`.

### Gestão de Unidades
No cadastro de usuário, é possível definir o array `allowedUnits`. Se vazio, o usuário não loga (exceto Admin).

---

## 4. Fluxo de Caixa (Tesouraria)
O modelo financeiro segue o padrão de **Fechamento Cego** para evitar fraudes.

1. **Abertura:** Operador declara Fundo Principal + Troco + Reserva.
2. **Operação:** Vendas em dinheiro somam ao saldo teórico da gaveta.
3. **Movimentações:**
   - **Sangria:** Saída de valor para cofre (Reduz saldo da gaveta).
   - **Suprimento:** Entrada de troco (Aumenta saldo da gaveta).
   - *Nota:* Transferências entre caixas (Primário <-> Gaveta) são auditadas.
4. **Fechamento:** O operador conta o dinheiro físico e informa. O sistema calcula a **Quebra de Caixa** (Diferença entre Teórico e Real).
   - *Segurança:* O operador não vê o saldo esperado antes de informar a contagem.

---

## 5. Auditoria e Anulação
- **Exclusão Lógica (`soft delete`):** Vendas deletadas **não somem** do banco. Elas recebem a flag `deleted: true`.
- **Relatórios:**
  - Vendas anuladas são removidas dos somatórios financeiros (Faturamento Líquido).
  - Elas aparecem destacadas no **Histórico** e no **Relatório de Fechamento** para auditoria do gerente.

---

## 6. Sincronização (Offline-First)
O hook `useSync` gerencia a consistência dos dados.

- **Status Online (Verde):** Dados fluindo em tempo real via WebSocket.
- **Status Sincronizando (Amarelo):** Upload de dados pendentes.
- **Conflito de Edição:** O sistema usa uma flag `isRemoteUpdate` para evitar que dados que acabaram de chegar do servidor sejam marcados como "alteração local" e reenviados, prevenindo loops infinitos.
- **Fila de Sincronização (`SyncQueue`):** Se a internet cair, as vendas são salvas no `localStorage` e uma fila de retry tenta enviar a cada 2 segundos até o sucesso.

---

## 7. Protocolo de Suporte
- **Feedback:** O botão de exclamação no topo abre a modal de feedback.
- **Logs:** Erros de API são logados no console com prefixo `[Sync]` ou `[Auth]`.
- **Reset:** Em caso de corrupção local, o Admin pode forçar um `Full Reset` em *Ajustes*, que limpa o banco da unidade ativa.

