
# 🍺 Botequista Pro - Sistema de Gestão para Bares (PWA)

![React](https://img.shields.io/badge/React-19-blue?logo=react&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-RTDB-orange?logo=firebase&style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-cyan?logo=tailwindcss&style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Offline--First-green?style=for-the-badge)

> **Versão:** 3.9.6 (Express Update)

O **Botequista Pro** é uma solução **PWA (Progressive Web App)** completa para gestão de bares e restaurantes, projetada para alta disponibilidade em ambientes com conectividade instável. 

Diferente de sistemas web tradicionais, ele opera com uma arquitetura **Offline-First Real**, garantindo que a operação de vendas nunca pare, mesmo sem internet.

---

## 🚀 Diferenciais de Engenharia

### 1. Arquitetura Offline-First & SyncQueue
O maior desafio técnico deste projeto foi garantir consistência de dados entre o cliente (Bar) e a nuvem (Firebase) em conexões 3G/4G instáveis.
*   **Persistência Local:** Utiliza `IndexedDB` (via wrapper `idb`) para armazenar o estado completo da aplicação no dispositivo.
*   **Fila de Sincronização:** Mutações (vendas, edições) são adicionadas a uma `SyncQueue` persistente. Um worker em background tenta enviar os dados para a Vercel/Firebase e realiza *retry* exponencial em caso de falha.
*   **Smart Merge:** Algoritmo de reconciliação de dados que evita sobrescrita acidental de vendas ao recuperar a conexão.

### 2. React 19 & Performance
*   Uso dos novos hooks e padrões do **React 19**.
*   **Virtualização & Memoização:** Componentes como `ProductItemsTab` utilizam `useDeferredValue` e `React.memo` para manter a interface fluida (60fps) mesmo renderizando listas com centenas de produtos em dispositivos móveis modestos.

### 3. Segurança & RBAC
*   Sistema robusto de **Controle de Acesso Baseado em Funções (RBAC)**.
*   Perfis granulares: Operador, Gerente e Admin, com permissões específicas para anular vendas, fechar caixa ou gerenciar estoque.

---

## ⚡ Funcionalidades Principais

### 🖥️ Terminal de Vendas (PDV)
*   **Modo Venda Rápida (Novo):** Interface otimizada para alto giro de balcão. Bloqueia "Pendura" e força pagamento imediato para agilidade máxima.
*   **Gestão de Mesas:** Abertura, acompanhamento e fechamento de contas de longo prazo.
*   **Mobile-First:** Interface 100% responsiva, funcionando como aplicativo nativo em Android/iOS.

### 💰 Tesouraria Blindada (Blind Close)
*   **Fechamento Cego:** O operador deve contar o dinheiro físico e informar ao sistema *sem saber* quanto o computador registrou. O sistema calcula a sobra/quebra automaticamente, prevenindo furtos.
*   **Auditoria:** Registro imutável de Sangrias (retiradas) e Suprimentos (fundo de troco).

### 📊 Inteligência de Negócio
*   **Relatórios em Tempo Real:** Faturamento, Ticket Médio e Curva ABC de produtos.
*   **Gestão de Fiados:** Controle de dívidas de clientes com sistema de quitação parcial ou total.
*   **Exportação:** Geração de comprovantes e relatórios em PNG/PDF direto no navegador.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interface reativa e tipagem estrita. |
| **Build Tool** | Vite | HMR instantâneo e build otimizado. |
| **Estilização** | Tailwind CSS | Design System consistente e Dark Mode nativo. |
| **Banco de Dados** | Firebase RTDB | Banco NoSQL em tempo real. |
| **Backend (API)** | Vercel Serverless | Functions para operações sensíveis e busca. |
| **Local Storage** | IndexedDB (`idb`) | Banco de dados transacional no navegador. |
| **Gráficos** | Recharts | Visualização de dados financeiros. |

---

## 📸 Screenshots

| PDV Mobile | Relatórios & Analytics |
| :---: | :---: |
| *Interface ágil para lançamento de pedidos* | *Controle financeiro e Curva ABC* |
| ![PDV Placeholder](https://placehold.co/400x800/0f172a/white?text=PDV+Mobile) | ![Dashboard Placeholder](https://placehold.co/400x800/0f172a/white?text=Dashboard) |

---

## 🔧 Como Executar Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/botequista-pro.git

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente (.env)
# Crie um arquivo .env na raiz com sua chave API do Google/Firebase
API_KEY=sua_chave_aqui

# 4. Execute em modo de desenvolvimento
npm run dev
```

## 📜 Licença

Este projeto é proprietário e desenvolvido para fins de portfólio e uso comercial restrito.

---
*Desenvolvido com ❤️ e muita cafeína.*
