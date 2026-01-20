
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.21)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** e **Otimização de Ticket Médio** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 📊 1. Inteligência de Dados (Relatórios v3.9.21)

### 1.1 Performance de Equipe (Restaurado)
- **Ranking**: Visualização por faturamento bruto e volume de atendimentos por colaborador através do vínculo `userId`.
- **Métrica**: Identificação de gargalos de atendimento e produtividade individual.

### 1.2 Visão Operacional (Mapa de Calor - Restaurado)
- **Fluxo Horário**: Gráfico de densidade de vendas por hora para ajuste de escala de funcionários. Utiliza `recharts` para visualização de alta densidade.
- **Pico de Demanda**: Identificação precisa do horário de maior pressão (stress-test) no balcão.

### 1.3 Mix de Produtos (Curva ABC - Restaurado)
- **Ranking de Saída**: Identificação dos produtos "campeões" por faturamento acumulado e volume de unidades.

---

## 🛡️ 2. Blindagem de Sessão (v3.9.21)

### 2.1 Confirmação de Logout
- **Segurança**: Bloqueio de saída acidental via `window.confirm`.
- **UX**: Garante que o operador não encerre a sessão durante um atendimento ou fechamento de conta.

---

## 📡 3. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Timezone local**: Filtros comerciais agora utilizam `toLocaleDateString('en-CA')`, respeitando o horário civil local do bar e não o UTC.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
