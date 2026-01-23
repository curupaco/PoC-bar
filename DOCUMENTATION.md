# 🍺 Botequista Pro - Documentação Técnica e Operacional

**Versão da Engine:** 3.9.46 (Queue-Driven)  
**Nível de Autoridade:** Produção Resiliente / Multi-Tenant Ready  
**Data da Documentação:** Janeiro de 2025

---

## 🏗️ Arquitetura Core: "Offline-First"

Diferente de sistemas comuns que travam sem internet, o **Botequista Pro** utiliza uma camada de persistência local que espelha as operações em tempo real.

### 1. Motor de Sincronismo (`useSync.ts`)
*   **SyncQueue**: Toda mutação (venda, comanda, alteração de preço) é serializada e mantida em uma fila no `localStorage` via `utils/syncQueue.ts`.
*   **QueueProcessor**: Um worker dedicado monitora a fila a cada **2 segundos**. Se houver sucesso no envio para o Firebase, o item é removido. Se falhar, entra em regime de *Exponential Backoff*.
*   **Heartbeat**: A cada **4 segundos**, o sistema verifica se há novos dados no servidor (novas mesas abertas por outros terminais, por exemplo).

### 2. Consistência de Dados (`utils/syncMerger.ts`)
*   **SmartMerge Algorithm**: Para evitar conflitos onde dois garçons editam a mesma mesa, implementamos um **Grace Period de 120 segundos**. 
*   **Lógica**: Se uma mesa foi alterada localmente nos últimos 2 minutos, o sistema ignora atualizações do servidor para essa mesa específica ("O garçom na mesa tem a palavra final").

---

## 🔐 Segurança e Governança (RBAC)

O sistema implementa **Role-Based Access Control** com 19 permissões granulares:

*   **Audit Trail**: Toda venda excluída recebe a flag `deleted: true`. O valor sai do faturamento líquido, mas permanece no banco para auditoria, informando o `userId` de quem anulou e o `timestamp`.
*   **Criptografia AES-256**: Através do `services/cryptoService.ts`, os dados podem ser encapsulados em um blob criptografado antes de subir para a nuvem, garantindo privacidade total.

---

## 📈 Inteligência Financeira e de Negócio

*   **Fechamento Cego**: O sistema não informa ao operador quanto "deveria" ter no caixa. Ele exige a contagem física (`actualCashCounted`) e gera o relatório de `cashDifference`.
*   **Curva ABC**: O relatório de produtos gera automaticamente um ranking por faturamento bruto, permitindo que o dono identifique os itens de maior margem e saída.
*   **Heatmap Operacional**: Análise de volume de comandas por hora para otimização de escala de garçons.

---

## 🗺️ Visão 4.0 (Escalabilidade)

O código atual foi escrito seguindo o padrão de **Tenancy**.
*   **Próximo Passo**: Migrar o prefixo fixo `/data` no Firebase para um roteamento dinâmico baseado no `barId` logado.
*   **Admin Hub**: Criação de um dashboard unificado para donos de redes de bares consultarem o lucro líquido total em um único clique.

---
*Este documento reflete fielmente a implementação técnica contida no repositório.*