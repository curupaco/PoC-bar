
# 🍺 Botequista Pro - Documentação do Sistema
**Versão:** 4.2.0 (Theme & Header Update)  
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

## 2. Interface e UX (User Experience)

### A. Identidade Visual (Header)
O cabeçalho foi redesenhado para destacar a marca **Botequista** usando a tipografia personalizada (Barrio). 
- **Status da Rede:** Traduzido integralmente para o Português (Conectado / Sincronizando).
- **Acessibilidade:** Botão de feedback movido para a extremidade direita para evitar cliques acidentais durante a troca de unidades.

### B. Gestão de Temas (Light/Dark)
O sistema suporta alternância entre modo claro e escuro.
- **Persistência:** A preferência de tema é salva no `localStorage` sob a chave `btq_theme`.
- **Implementação:** Utiliza a estratégia de classe `dark` no elemento raiz (`html`) via TailwindCSS.

### C. Feedback Visual de Carregamento (Loading Screen)
- **Animação:** Uma caneca de cerveja estilizada que enche e esvazia, acompanhada de espuma animada.
- **Contexto:** Aparece durante o login, troca de unidade e carregamento inicial.

---

## 3. Cardápio Inteligente & Upsell
O sistema de produtos possui três camadas de complexidade para agilizar o atendimento:

### A. Tipos de Venda
- **Unidade:** Venda padrão (Cervejas, Latas).
- **Peso (KG):** Aciona automaticamente o modal de pesagem.

### B. Modificadores (Adicionais)
Grupos de opções que podem ser vinculados a produtos.

---

## 4. Requisitos de Configuração (Variáveis de Ambiente)
As seguintes variáveis devem ser configuradas no painel da Vercel para o funcionamento do sistema de Feedback:

| Variável | Descrição |
| :--- | :--- |
| `GITHUB_TOKEN` | Personal Access Token (Classic) com escopo `repo`. |
| `GITHUB_OWNER` | Nome do usuário ou organização dona do repositório. |
| `GITHUB_REPO` | Nome do repositório onde as issues serão criadas. |

---

## 5. Protocolo de Suporte
- **Feedback:** O botão de balão no canto superior direito abre a modal de feedback integrada ao GitHub.
- **Logs:** Erros de API são logados no console com prefixo `[Sync]` ou `[Feedback API]`.
