
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.24)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🏗️ 1. Arquitetura Consolidada (v3.9.24)

### 1.1 Eliminação de Redundância
- **Proxy de Exportação**: O arquivo `POS.tsx` na raiz foi neutralizado e agora atua apenas como um redirecionador para `components/POS.tsx`. Isso garante que 100% da lógica de venda esteja centralizada em um único ponto.

---

## 🎨 2. Identidade Visual Imersiva (Anti-Browser UI)

### 2.1 Erradicação do window.confirm
- **Custom Modals**: Todas as telas (PDV, Cardápio, Configurações) agora utilizam modais proprietários. Não existem mais alertas ou confirmações nativas do navegador, garantindo uma experiência 100% "White Label".

### 2.2 Unificação de Bloqueio (Shift Lock)
- **Visual**: As telas de Venda e Tesouraria utilizam agora o mesmo motor de renderização para o estado de "Turno Fechado", com animações sincronizadas e iconografia de alta fidelidade.

---

## 📡 3. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Timezone Local**: Filtros comerciais respeitam rigorosamente o horário civil do estabelecimento.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
