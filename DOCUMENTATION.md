
# 🍺 Botequista Pro - Documentação Técnica e Operacional
**Versão:** 5.3.6 (Total Recovery Update)  
**Desenvolvedor:** Senior Frontend Engineer  
**Stack:** React 19, Firebase RTDB, Vercel Edge.

---

## 1. Visão Geral
O **Botequista** é um PDV (Ponto de Venda) de alta performance projetado para operação crítica de bares. O sistema foca em imutabilidade financeira, auditoria de caixa e resiliência de dados em ambientes com internet instável.

---

## 2. Módulos de Gestão
O sistema é dividido em 4 pilares operacionais:
1.  **PDV (Vendas):** Terminal de lançamentos rápidos e comandas/mesas de longa duração.
2.  **Turnos & Auditoria:** Controle de jornada com conferência cega de caixa e apuração de quebra.
3.  **Tesouraria (Caixas):** Gestão imutável de Sangrias, Suprimentos e Transferências entre Cofre e Gaveta.
4.  **Cardápio & Equipe:** Gestão de inventário com modificadores dinâmicos e controle de acesso baseado em permissões (RBAC).

---

## 3. Diagnóstico de Saúde em 3 Níveis
Acesse o modal de diagnóstico clicando no indicador de status no cabeçalho:
1.  **Conexão Local (Wi-Fi/4G):** Valida a conectividade física do dispositivo.
2.  **Servidor App (Vercel):** Ping real para o endpoint `/api/health`, garantindo que as Edge Functions estão ativas.
3.  **Nuvem (Firebase):** Status do canal de dados em tempo real.

---

## 4. Segurança Financeira & Prevenção de Inadimplência

### A. API de Devedores Globais (`api/debtors.ts`)
Para superar o limite de cache local, o sistema consulta a nuvem para escanear os últimos 2.000 registros históricos em busca de devedores ativos.
- **Alerta [!] PERFIL DEVEDOR:** Aviso visual crítico exibido ao digitar nomes com débito pendente.

### B. Monitor de Comandas de Longa Duração
Define um limite (padrão 4h) para o tempo de mesa aberta. Mesas que excedem o tempo ganham bordas âmbar pulsantes.

---

## 5. Auditoria de Tesouraria (Protocolo Append-Only)
As movimentações de caixa não são "editáveis". Cada sangria ou suprimento gera um log individual:
- O saldo do turno é uma resultante matemática, impedindo manipulações retroativas de saldos.
- Anulações de vendas também são logs lógicos, mantendo o registro original para conferência do gestor no Histórico.

---

## 6. Sincronização e PWA
- **Sync Queue:** Fila de sincronização via `IndexedDB` para garantir que vendas feitas offline sejam salvas assim que a conexão retornar.
- **Atomic Load:** Sistema de travas que impede a exibição de interfaces de venda antes de confirmar o estado real do turno na nuvem.

---
*Documentação atualizada em: [Data de Hoje] (v5.3.6)*
