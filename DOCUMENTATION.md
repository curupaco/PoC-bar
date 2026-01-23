# 🍺 Botequista Pro - Documentação de Engenharia

**Versão:** 3.9.46 Stable  
**Autor:** Senior System Architect  
**Ambiente:** PWA / Realtime Cloud

---

## 🛰️ 1. Arquitetura de Sincronismo Local-First

O sistema não depende de conexão estável para operar. Todas as mutações de estado seguem o fluxo:
1. **Action Trigger:** O usuário interage (venda, mesa, preço).
2. **Local Commit:** O estado é persistido no `localStorage` do dispositivo.
3. **Queue Enqueue:** A ação entra na `SyncQueue` com um UUID único.
4. **Background Upload:** O worker de sincronismo tenta empurrar a fila para o Firebase com lógica de retry exponencial.

### Gestão de Concorrência (SmartMerge)
Para evitar que múltiplos garçons editando a mesma mesa causem perda de dados, o sistema implementa um **Grace Period de 120 segundos**. Durante este período, o terminal local tem autoridade soberana sobre o servidor para aquela chave específica de mesa.

---

## 🗄️ 2. Dicionário de Dados (NoSQL Schemas)

### Nó: `/sales` (Histórico Imutável)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único da transação. |
| `timestamp` | EPOCH | Data/Hora da venda (milissegundos). |
| `deleted` | BOOLEAN | Flag de auditoria (Anulação Lógica). |
| `userId` | STRING | Referência ao colaborador que operou a venda. |

### Nó: `/shifts` (Controle de Jornada)
O sistema utiliza **Conferência Cega**. O operador não sabe quanto o sistema espera que ele tenha em caixa.
- `openingCashChange`: Fundo de troco inicial.
- `actualCashCounted`: Valor real contato pelo humano no fechamento.
- `cashDifference`: O desvio calculado entre o sistema e o real (Quebra de Caixa).

---

## 🔐 3. Segurança RBAC (Role Based Access Control)

A segurança é granulada por chaves de permissão injetadas no token de sessão:
- `delete_sale`: Permite anular vendas (ativa flag `deleted`).
- `full_reset`: Comando administrativo para zerar banco de dados.
- `manage_backup`: Permite sincronização externa via GitHub Gists API.

---

## 📈 4. Inteligência de Negócio

O motor de relatórios utiliza **Reducers** em tempo real para calcular:
- **Curva ABC:** Ranking de lucratividade vs popularidade dos itens.
- **Hourly Heatmap:** Mapa de calor de volume de pedidos por hora (0-23h).
- **Pendura Threshold:** Monitoramento de risco de crédito global (Fiados).

---
*Documento autogerado para fins de auditoria técnica.*