
# 🍺 Botequista - Sistema de Gestão para Bares

**Versão Atual:** 3.9.46 (Queue & Merger Architecture)
**Stack Tecnológica:** React 19, Tailwind CSS 3.4, Firebase (Realtime Database), Vercel.

---

## 🚨 Atualização Crítica: Motor de Sincronização 3.0 (v3.9.46)

Implementação de resiliência total contra falhas de rede (Modo Offline-First real):

### 1. Sistema de Fila Persistente (`utils/syncQueue.ts`)
- **Problema:** Anteriormente, se a internet caísse exatamente no momento de salvar uma venda, a requisição falhava e o dado podia ser perdido se o usuário recarregasse a página.
- **Solução:** Agora, todas as alterações (vendas, cadastro de produtos, mesas) são salvas instantaneamente no `localStorage` dentro de uma fila.
- **Background Worker:** Um processo roda a cada 2 segundos verificando se há itens na fila. Se houver e a internet estiver ativa, ele envia um por um. Se falhar, ele tenta novamente depois.
- **Benefício:** Você pode operar sem internet. Assim que o sinal voltar, o sistema "despeja" todas as operações pendentes automaticamente.

### 2. Utilitário de Fusão Inteligente (`utils/syncMerger.ts`)
- Lógica centralizada para garantir que dados vindos do servidor não sobrescrevam trabalho em andamento.
- Mantém a regra dos **120 segundos** de proteção para mesas novas (Smart Merge).
- Gerencia o fallback automático para dados locais caso o Firebase esteja inacessível no boot.

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
Cada vez que um dado é enfileirado para envio, uma cópia de segurança do estado atual é salva no navegador (`localStorage`), prevenindo perda de dados em caso de fechamento acidental da aba ou bateria acabando.

---

*Documentação atualizada em conformidade com o padrão Botequista Pro v3.9.46.*
