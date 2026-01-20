
# 🍺 Botequista - Manifesto de Gestão e Operação de Alta Performance (v3.9.16)

O Botequista não é apenas um software de PDV; é uma **Engenharia de Blindagem Financeira** e **Otimização de Ticket Médio** desenhada especificamente para o ecossistema dinâmico de bares e gastronomia de alto giro.

---

## 🚀 1. Inteligência de Vendas (O Fator Upsell)

### 1.1 Menus de Modificadores Automáticos
- **Engenharia**: Ao vincular um "Menu de Opções" a uma categoria (ex: Porções), o sistema abre obrigatoriamente uma janela de adicionais no momento do lançamento.
- **Impacto**: Aumento estatístico de até **18% no Ticket Médio**.

### 1.2 Navegação de Alta Densidade (Novo)
- **Busca em Tempo Real**: O cardápio conta com um motor de busca `useMemo` que filtra instantaneamente por nome do produto ou categoria, reduzindo o tempo de localização em cardápios extensos.
- **Categorias Colapsáveis**: Implementação de estado `Set<string>` para controle de visibilidade. Clique no título da categoria para expandir/recolher, otimizando a área útil da tela em dispositivos móveis.

---

## ⚖️ 2. Operação de Precisão (Gramatura Digital)

### 2.1 Engine de Conversão Instantânea
- **Precisão**: Conversão de gramas para valor monetário em tempo real.
- **Interface Tátil**: Teclado numérico de alta visibilidade (UX Fitts' Law).

---

## 🛡️ 3. Blindagem Financeira & UX UI (Aprovado em Operação)

### 3.1 Recebimento Múltiplo & Troco
- **Flexibilidade**: Fechamento de mesa com múltiplos métodos de pagamento.
- **Troco Inteligente**: Exibe o troco em destaque ao selecionar valores rápidos.

### 3.2 Blindagem de UI - Rodapé PDV (Novo)
- **CSS Layout Guard**: O rodapé de pagamento e o botão "CONCLUIR" agora utilizam `shrink-0` e posicionamento `sticky` garantido. Isso impede que o botão de finalização de venda suma abaixo da dobra da tela ou atrás do teclado em dispositivos Android/iOS.

### 3.3 Segurança de Sessão (Zero Persistence)
- **F5 Protocol**: Atualizar a página (F5) limpa a sessão atual para segurança operacional.

---

## 📡 4. Sincronismo & Resiliência

- **Multi-Device**: Sincronização via Firebase Realtime Database.
- **Criptografia**: Proteção AES-256-CBC-PKCS7 antes da persistência em nuvem.

---
**Botequista Pro - Professional Gastronomy Ecosystem**
*Sua operação blindada. Seu lucro garantido.*
