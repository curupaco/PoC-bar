
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.43 (Hotfix Persistence)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 🚨 Atualização Crítica: Motor de Sincronização 2.0 (v3.9.43)

Para resolver problemas de fechamento involuntário de turnos e perda de comandas em redes instáveis, o núcleo de dados foi reescrito:

### 1. Tolerância a Falhas (Fault Tolerance)
- O carregamento inicial utiliza `Promise.allSettled`. Se a tabela de vendas falhar no download, o sistema **não bloqueia** o carregamento dos turnos e produtos.
- **Local Fallback:** Se a conexão cair durante o carregamento inicial, o sistema busca automaticamente a última versão salva no `localStorage`.

### 2. Fila de Pendências (Queueing)
- Anteriormente, edições rápidas podiam ser descartadas se uma sincronização já estivesse em andamento (Race Condition).
- Agora, existe uma fila de espera. Se você adicionar um item enquanto o sistema salva, a alteração entra numa fila e é enviada imediatamente após a conclusão do processo atual.

### 3. Cache Busting Agressivo
- Todas as requisições de leitura agora incluem timestamp (`?t=...`) e headers HTTP para impedir que o iOS/Safari sirva dados antigos (stale data) que causavam o "sumiço" de mesas recém-criadas.

---

## 📋 Visão Geral do Sistema

O **Botequista** é uma aplicação web progressiva (PWA) focada na gestão ágil de bares e restaurantes de alto giro. O sistema prioriza velocidade operacional, integridade financeira e facilidade de uso em dispositivos móveis e desktops.

---

## 🔐 Matriz de Autoridade (RBAC)

O sistema utiliza Controle de Acesso Baseado em Funções (RBAC) granular, dividido em 4 esferas de competência:

### 1. Visibilidade de Módulos (Navegação)
Define quais abas da Sidebar o usuário pode visualizar e acessar. 
- **Exemplos:** `pos` (Vendas), `history` (Histórico), `reports` (Relatórios).

### 2. Controle de Fluxo (Gestão de Turno)
Define quem tem autoridade para iniciar e encerrar a jornada financeira.
- **Exemplos:** `open_shift`, `close_shift`, `clear_fiado`.

### 3. Autoridade de Inventário
Define quem pode alterar a estrutura de vendas do estabelecimento.
- **Exemplos:** `edit_product`, `delete_product`.

### 4. Segurança e Auditoria Crítica
Privilégios de alto nível que permitem a alteração de dados históricos e exportação de informações sensíveis.
- **Exemplos:** `delete_sale` (Anular Venda), `manage_backup` (GitHub Sync), `full_reset`.

---

## ⚙️ Integridade de Dados e Cache

### Backup Local Automático
Cada vez que um dado é enviado para a nuvem, uma cópia idêntica é salva no navegador (`localStorage`).
- `btq_shifts_backup`: Garante que o turno permaneça aberto mesmo offline.
- `btq_tabs_backup`: Garante que as mesas não sumam se a rede falhar.

### Service Worker Bypass
O Service Worker foi configurado para **não interceptar** chamadas ao Firebase ou API Vercel, garantindo que dados transacionais sejam sempre "Network First".

---

*Documentação atualizada em conformidade com o padrão Botequista Pro v3.9.43.*
