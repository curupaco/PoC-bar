# 🍺 Botequista Pro - Sistema de Gestão para Bares (PWA)

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-RTDB-orange?logo=firebase&style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Offline_First-green?style=for-the-badge)

**[📘 Documentação Técnica Completa](DOCUMENTATION.md)**

</div>

---

## ⚡ Visão Geral

O **Botequista Pro** é uma solução **PWA (Progressive Web App)** de classe empresarial para gestão de bares e restaurantes. Projetado sob a filosofia **Offline-First**, ele garante que a operação de vendas (PDV) continue fluida e sem interrupções, independentemente da estabilidade da conexão de internet.

Diferente de sistemas web tradicionais, o Botequista trata a nuvem como um "estado eventual", priorizando a responsividade local e a segurança dos dados na ponta (Edge).

---

## 🏛️ Arquitetura Offline & Sync

O coração do sistema é uma **SyncQueue** (Fila de Sincronização) resiliente. O diagrama abaixo ilustra como garantimos que nenhuma venda seja perdida:

```mermaid
sequenceDiagram
    participant User as 👤 Operador
    participant UI as 🖥️ Interface
    participant IDB as 🗄️ IndexedDB (Local)
    participant Worker as ⚙️ Sync Worker
    participant Cloud as ☁️ Firebase

    User->>UI: Realiza Venda (Sem Internet)
    UI->>IDB: Persiste Venda (Criptografada)
    UI->>Worker: Enfileira Job { action: 'SAVE_SALE' }
    UI-->>User: ✅ Feedback Imediato "Salvo"
    
    loop Background Sync
        Worker->>Worker: Verifica Conexão...
        alt Online
            Worker->>Cloud: PUT /sales/{id}
            Cloud-->>Worker: 200 OK
            Worker->>IDB: Remove Job da Fila
            Worker->>UI: Atualiza Status (Sincronizado)
        else Offline
            Worker->>Worker: Aguarda (Exponential Backoff)
        end
    end
```

### Stack Tecnológica

| Camada | Tecnologia | Destaques |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Hooks modernos, `useDeferredValue` para performance. |
| **Linguagem** | TypeScript | Tipagem estrita e interfaces compartilhadas. |
| **Persistência** | IndexedDB (`idb`) | Banco transacional no navegador. |
| **Backend** | Firebase RTDB | NoSQL em tempo real com regras de validação. |
| **API** | Vercel Serverless | Functions para buscas pesadas e relatórios. |
| **Design** | Tailwind CSS | Sistema de design tokenizado e Dark Mode nativo. |

---

## 📸 Interface do Sistema

> *O design prioriza contraste, legibilidade em ambientes noturnos e áreas de toque grandes para telas touch.*

| **Terminal de Vendas (PDV)** | **Relatórios Gerenciais** |
| :---: | :---: |
| ![PDV Screen](./docs/screenshots/pdv_screen.png) | ![Dashboard Analytics](./docs/screenshots/analytics_screen.png) |
| *Fluxo rápido com botões de acesso imediato* | *Curva ABC e Fluxo de Caixa em tempo real* |

---

## 🚀 Funcionalidades Chave

### 1. Venda Expressa (Speed-Checkout)
Para bares com alto giro de balcão. O sistema gera automaticamente uma comanda temporária, bloqueia métodos de pagamento demorados (como "Pendura") e foca em fechar o pedido em menos de 3 cliques.

### 2. Tesouraria "Blind Close"
O fechamento de caixa é "cego". O operador insere a contagem física do dinheiro sem saber o valor esperado pelo sistema. O Botequista calcula automaticamente sobras ou quebras, prevenindo furtos e erros de contagem.

### 3. Gestão de Inventário & Curva ABC
Engenharia de cardápio integrada. Identifique automaticamente quais produtos são seus "Carro-Chefe" (Alta Venda / Alta Margem) e quais são "Abacaxis" (Baixa Venda / Baixa Margem).

---

## 🔧 Instalação e Desenvolvimento

```bash
# 1. Clone o repositório oficial
git clone https://github.com/botequista/sistema.git

# 2. Instale as dependências
npm install

# 3. Configure o ambiente
# Crie um arquivo .env na raiz com as chaves do Firebase
cp .env.example .env

# 4. Inicie o servidor local
npm run dev
```

## 📜 Licença

© 2024 Botequista Systems. Todos os direitos reservados.
Distribuído sob licença proprietária para uso comercial restrito.

---
*Developed with High-Performance React Standard.*
