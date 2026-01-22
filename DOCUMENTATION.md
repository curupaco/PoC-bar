
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.45 (Smart Merge Update)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 🚨 Atualização Crítica: Motor de Sincronização 2.2 (v3.9.45)

Resolução definitiva para desaparecimento de comandas em alta concorrência:

### 1. Protocolo Smart Merge (Mesas)
- Ao receber a lista de mesas do servidor, o sistema não sobrescreve cegamente a lista local.
- **Lógica de Resgate:** Se uma mesa existe localmente mas não no servidor, o sistema verifica a data de criação. Se foi criada há menos de 2 minutos, ela é **mantida** na tela (assumindo que o upload ainda está pendente), impedindo que o "Heartbeat" apague comandas recém-criadas.

### 2. Double Check de Concorrência
- O bloqueio de atualizações durante a edição (Grace Period) agora é verificado **duas vezes**: antes de iniciar o download e *após* o download terminar.
- Isso cobre o cenário onde o usuário cria uma mesa *enquanto* o download estava em andamento, garantindo que a resposta atrasada do servidor (que não contém a mesa nova) seja descartada.

### 3. Heartbeat Sync (Tempo Real)
- Polling a cada 4 segundos para sincronizar até 5 terminais simultâneos.

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

*Documentação atualizada em conformidade com o padrão Botequista Pro v3.9.45.*
