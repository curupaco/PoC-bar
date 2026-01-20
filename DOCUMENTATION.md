
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.32)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura e Consistência (v3.9.32)

### 1.1 Padronização Forense (NOVO)
- **Identidade em Logs**: Unificação dos campos de auditoria (`openedBy`, `closedBy`, `deletedBy`) para gravarem o `username`. Isso permite a inspeção imediata de logs no banco de dados sem a necessidade de cruzamento manual de IDs.
- **Integridade Relacional**: O campo `userId` das transações permanece intacto (ID único), preservando o funcionamento de rankings e relatórios de performance de equipe.

### 1.2 Transparência em Cancelamentos
- **Visibilidade de Anulações no Turno**: O modal de conferência exibe o total anulado no expediente para auditoria imediata.

### 1.3 Supervisão de Anulações
- **Lixeira Gerencial**: Acesso visual a registros deletados logicamente através do toggle de supervisão no histórico.

---

## 📡 2. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Timezone Local**: Filtros comerciais respeitam rigorosamente o horário civil do estabelecimento.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
