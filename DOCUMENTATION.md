
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.44 (Live Sync Update)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 🚨 Atualização Crítica: Motor de Sincronização 2.1 (v3.9.44)

Melhorias para ambientes multi-usuário e alta concorrência:

### 1. Heartbeat Sync (Tempo Real)
- O sistema agora implementa um mecanismo de **polling** (batimento) a cada 4 segundos.
- Isso permite que até 5 garçons operem simultaneamente. Quando um garçom lança um item em uma mesa, os outros terminais recebem a atualização automaticamente, sem necessidade de recarregar a página.
- O sistema prioriza a "Autoridade do Servidor" para Mesas (`openTabs`), Vendas (`sales`) e Turnos (`shifts`).

### 2. Tolerância a Falhas (Fault Tolerance)
- O carregamento inicial utiliza `Promise.allSettled`. Se a tabela de vendas falhar no download, o sistema **não bloqueia** o carregamento dos turnos e produtos.
- **Local Fallback:** Se a conexão cair durante o carregamento inicial, o sistema busca automaticamente a última versão salva no `localStorage`.

### 3. Fila de Pendências (Queueing)
- Edições rápidas não são mais descartadas se uma sincronização já estiver em andamento. O sistema enfileira a alteração e a envia assim que o canal estiver livre.

---

## 📋 Visão Geral do Sistema

O **Botequista** é uma aplicação web progressiva (PWA) focada na gestão ágil de bares e restaurantes de alto giro. O sistema prioriza velocidade operacional, integridade financeira e facilidade de uso em dispositivos móveis e desktops.

---

## 🔐 Matriz de Autoridade (RBAC)

O sistema utiliza Controle de Acesso Baseado em Funções (RBAC) granular, dividido em 4 esferas de competência:

### 1. Visibilidade de Módulos (Navegação)
- **Exemplos:** `pos` (Vendas), `history` (Histórico), `reports` (Relatórios).

### 2. Controle de Fluxo (Gestão de Turno)
- **Exemplos:** `open_shift`, `close_shift`, `clear_fiado`.

### 3. Autoridade de Inventário
- **Exemplos:** `edit_product`, `delete_product`.

### 4. Segurança e Auditoria Crítica
- **Exemplos:** `delete_sale` (Anular Venda), `manage_backup` (GitHub Sync), `full_reset`.

---

## ⚙️ Integridade de Dados

### Backup Local Automático
Cada vez que um dado é enviado para a nuvem, uma cópia idêntica é salva no navegador (`localStorage`), prevenindo perda de dados em caso de queda de internet durante o serviço.

---

*Documentação atualizada em conformidade com o padrão Botequista Pro v3.9.44.*
