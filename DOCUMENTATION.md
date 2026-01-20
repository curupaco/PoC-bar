
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.27)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura e Consistência (v3.9.27)

### 1.1 Blindagem de Parsing de Data (iOS/Safari Fix)
- **Universal Date Engine**: O motor de filtragem de relatórios foi atualizado para utilizar o construtor `new Date(Y, M, D)` ao invés de parsing de strings ISO via template literal. Isso resolve a falha crítica de `NaN` em dispositivos Apple e navegadores com parsers ISO rigorosos, garantindo que comandas e faturamentos noturnos sejam sempre contabilizados corretamente.

### 1.2 Eliminação de Redundância de Módulos
- **Proxy de Relatórios**: O arquivo `Reports.tsx` na raiz foi convertido em um Proxy para `components/Reports.tsx`. Agora, todos os módulos principais possuem uma Fonte Única de Verdade (Single Source of Truth), eliminando divergências de lógica entre versões obsoletas no build.

### 1.3 Blindagem de Conciliação
- **Rastreabilidade de Tesouraria**: O sistema diferencia o Fundo Inicial das Movimentações Internas (Sangrias/Suprimentos) no fechamento de turno.
- **Memória de Abertura**: Introdução de campos `openingCash` no schema de `Shift` para garantir transparência total na conferência de gaveta.

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
