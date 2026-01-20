
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.28)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura e Consistência (v3.9.28)

### 1.1 Limpeza de Órfãos (NOVO)
- **Integridade em Cascata**: Ao excluir um "Menu de Opções", o sistema agora realiza uma varredura automática em todo o cardápio e nas regras de automação. Produtos e categorias vinculados ao menu excluído são "desmamados" instantaneamente, evitando falhas de referência e garantindo que o PDV nunca tente carregar dados inexistentes.

### 1.2 Blindagem de Parsing de Data (iOS/Safari Fix)
- **Universal Date Engine**: O motor de filtragem utiliza o construtor `new Date(Y, M, D)` para evitar erros de `NaN` em dispositivos Apple.

### 1.3 Blindagem de Conciliação
- **Rastreabilidade de Tesouraria**: Diferenciação clara entre Fundo Inicial e Movimentações Internas no fechamento de turno.

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
