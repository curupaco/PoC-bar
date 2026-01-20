
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.26)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura e Consistência (v3.9.26)

### 1.1 Blindagem de Conciliação (NOVO)
- **Rastreabilidade de Tesouraria**: O sistema agora diferencia o Fundo Inicial das Movimentações Internas (Sangrias/Suprimentos) no fechamento de turno.
- **Memória de Abertura**: Introdução de campos `openingCash` no schema de `Shift` para garantir que o saldo esperado seja decomposto de forma transparente para o gestor.

### 1.2 Unificação de Bloqueio (Shift Lock)
- **Engine Única**: As telas de PDV e Tesouraria utilizam o mesmo motor de renderização para o estado de "Turno Fechado", com animações de pulsação e iconografia de alta fidelidade.

---

## 📊 2. Inteligência de Dados

### 2.1 Performance de Equipe
- **Ranking**: Visualização por faturamento bruto e volume de atendimentos por colaborador através do vínculo `userId`.

### 2.2 Visão Operacional (Mapa de Calor)
- **Fluxo Horário**: Gráfico de densidade de vendas por hora para ajuste de escala de funcionários.

---

## 📡 3. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Timezone Local**: Filtros comerciais respeitam rigorosamente o horário civil do estabelecimento.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
