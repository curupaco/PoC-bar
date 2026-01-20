
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.33)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura e Consistência (v3.9.33)

### 1.1 Blindagem de Dados em Mesas Abertas (NOVO)
- **Varredura de Modificadores Órfãos**: Ao excluir um grupo de modificadores, o sistema agora realiza uma varredura automática em todas as mesas abertas (`openTabs`). Itens que possuíam modificadores vinculados ao grupo excluído têm esses opcionais removidos e seus preços recalculados instantaneamente.
- **Integridade de Registro**: Impede que itens em mesas ativas exibam descrições ou preços de modificadores que não existem mais na base de dados principal.

### 1.2 Padronização Forense
- **Identidade em Logs**: Unificação dos campos de auditoria (`openedBy`, `closedBy`, `deletedBy`) para uso exclusivo de `username`.

### 1.3 Transparência Financeira
- **Visibilidade de Anulações no Turno**: Exibição clara do total anulado no expediente para conferência rápida.

---

## 📡 2. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Timezone Local**: Filtros comerciais respeitam rigorosamente o horário civil do estabelecimento.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
