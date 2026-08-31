# 🍺 Botequista Pro - Sistema de Gestão para Bares (PWA)

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript&style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-RTDB-orange?logo=firebase&style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Offline_First-green?style=for-the-badge)

**[📘 Documentação Técnica Completa](DOCUMENTATION.md)**

> *Este repositório representa uma Prova de Conceito funcional, desenvolvida com foco em arquitetura offline-first e performance.*

</div>

---

## ⚡ Visão Geral

O **Botequista Pro** é uma solução **PWA (Progressive Web App)** de nível enterprise para gestão de bares e restaurantes. Projetado sob a filosofia **Offline-First**, ele garante que a operação de vendas (PDV) continue fluida e sem interrupções, independentemente da estabilidade da conexão de internet.

Diferente de sistemas web tradicionais, o Botequista trata a nuvem como um "estado eventual", priorizando a responsividade local e a segurança dos dados na ponta (Edge).

---

## 🎨 Design System & Arquitetura UI (`src/shared/ui/`)

A partir da versão **v5.6.0**, a interface do Botequista conta com um **Design System nativo reutilizável** baseado no paradigma *Modern Premium & Clean*, trazendo padronização visual completa e garantia de tipos TypeScript:

- **`<Button />`**: Botões padronizados com variantes (`primary`, `secondary`, `dark`, `outline`, `ghost`, `danger`, `success`), suporte nativo a `isLoading` (spinner SVG), tamanhos e micro-interações (`active:scale-95`).
- **`<Input />`, `<Select />`, `<Textarea />`**: Controles de formulário unificados com labels integrados, validação visual de erro e foco responsivo.
- **`<Card />`**: Containers com elevação responsiva, suporte a glassmorphism e cabeçalhos/rodapés flexíveis.
- **`<Badge />`**: Chips semânticos de status (`success`, `warning`, `danger`, `info`, `neutral`) com suporte a ponto indicador (`dot`).
- **`<Modal />`**: Diálogos modais com overlay de desfoque, bloqueio de rolagem do corpo e fechamento por atalho (`ESC`).
- **`<Tabs />`**: Navegação por abas em estilos de pílulas e sublinhado.

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

## 🧠 Decisões de Engenharia

### Por que Firebase RTDB e não Firestore?
Optamos pelo **Realtime Database** pela sua estrutura JSON nativa, que mapeia diretamente para objetos JavaScript e facilita o espelhamento "raw" no IndexedDB. O overhead de latência do Firestore e o modelo de cobrança por leitura não se adequavam à nossa estratégia de sincronização frequente de pequenos pacotes de estado (SyncQueue).

### Por que PWA e não App Nativo?
O **Botequista** precisa rodar em hardware heterogêneo (tablets baratos Android, iPads antigos, PCs Windows). O PWA oferece:
1.  **Deploy Instantâneo:** Atualizações críticas chegam a todos os terminais em segundos via Vercel.
2.  **Custo Zero de Distribuição:** Sem taxas de Apple/Google Store ou tempo de aprovação.
3.  **Capacidades Nativas:** Service Workers modernos já permitem cache robusto e acesso a hardware suficiente para PDV.

### Trade-offs do Offline-First
A arquitetura "Local-First" traz desafios específicos que foram aceitos em prol da disponibilidade:
*   **Consistência Eventual:** A UI é otimista; o usuário vê a ação concluída antes do servidor confirmar.
*   **Gestão de Conflitos:** Utilizamos a estratégia *Last-Write-Wins* baseada em timestamp do cliente, assumindo que a operação mais recente no ponto físico de venda é a autoridade máxima.

### Limitações Conhecidas
*   **Safari/iOS:** O ciclo de vida do Service Worker no iOS é agressivo. Se o app não for adicionado à Home Screen ("Add to Home Screen"), o Safari pode limpar o IndexedDB após 7 dias de inatividade.
*   **Concorrência:** Não há bloqueio de registro (Locking) em tempo real entre dispositivos.

---

## 📸 Interface do Sistema

> *O design prioriza contraste, legibilidade em ambientes noturnos e áreas de toque grandes para telas touch.*

| **Terminal de Vendas (PDV)** | **Relatórios Gerenciais** |
| :---: | :---: |
| ![PDV Screen](https://placehold.co/800x600/0f172a/ffffff?text=Interface+PDV+Dark+Mode) | ![Dashboard Analytics](https://placehold.co/800x600/0f172a/ffffff?text=Analytics+e+KPIs) |
| *Fluxo rápido com botões de acesso imediato* | *Curva ABC e Fluxo de Caixa em tempo real* |

---

## 🚀 Funcionalidades Chave

### 1. Venda Expressa (Speed-Checkout)
Para bares com alto giro de balcão. O sistema gera automaticamente uma comanda temporária, bloqueia métodos de pagamento demorados (como "Pendura") e foca em fechar o pedido em menos de 3 cliques.

### 2. Tesouraria "Blind Close"
O fechamento de caixa é "cego". O operador insere a contagem física do dinheiro sem saber o valor esperado pelo sistema. O Botequista calcula automaticamente sobras ou quebras, preventindo furtos e erros de contagem.

### 3. Gestão de Inventário & Curva ABC
Engenharia de cardápio integrada. Identifique automaticamente quais produtos são seus "Carro-Chefe" (Alta Venda / Alta Margem) e quais são "Abacaxis" (Baixa Venda / Baixa Margem).

### 4. Inteligência e Segurança Operacional (v4.9.0)
- **Radar de Prejuízo (v4.9.0):** Algoritmo que cruza CMV e vendas para apontar itens com margens abaixo de 30% e alto giro, ajudando o dono a agir contra a inflação e precificar melhor.
- **Smart Stock Híbrido (v4.9.0):** Alertas de estoque preditivos para itens controlados e modo **Alta Demanda (Hot Item)** para produtos sem estoque.
- **Modo Evento / Balada (v4.8.1):** Trava o PDV em fluxo de Venda Expressa contínua.
- **Happy Hour Inteligente (v4.8.1):** Transição de preços automática com badges promocionais.
- **QR Code da Mesa (v4.7.3):** Cliente escaneia para ver a conta ou pagar.
- **Resumo Diário via WhatsApp:** Relatório consolidado enviado automaticamente ao fechar o turno.

### 5. Monitor de Produção da Cozinha (v4.9.5)
Painel dark-mode touch-friendly de alto contraste desenvolvido especialmente para cozinhas, bares ou chapas.
- **Fila de Produção Reativa (PENDING):** Agrupa os pratos a serem feitos com base nos pedidos das comandas ativas (FIFO), com cronômetros de tempo de espera e alertas de atraso cromáticos.
- **Campainha e Alertas Globais (Ding! 🛎️):** Sintetizador Web Audio API puro que gera som físico de campainha de balcão e dispara alertas Toast sincronizados para todos os atendentes conectados ao mesmo bar no exato milissegundo em que o prato é marcado como pronto.
- **Sinalização Reativa no PDV (🛎️):** O PDV avisa o garçom piscando um sino nos cards de mesa que possuem pratos prontos, enquanto a Sidebar exibe o total de pendências em tempo real.
- **Histórico e Segurança Financeira (Fechada 🔒):** Mantém comandas fechadas/pagas visíveis na aba de "Prontos" por 2h (limite de 15 tickets). Estes tickets aparecem com uma trava de segurança e cadeado, impedindo edições manuais que possam afetar os relatórios financeiros do caixa.

### 6. Registro de Perda & Desperdício de Estoque (v5.0.0)
Módulo inteligente para rastrear descarte de insumos e mercadorias com total transparência e auditoria.
- **Lógica de Custo Histórico:** Grava o preço de custo no momento exato do descarte (`LOSS`), protegendo relatórios financeiros contra flutuações futuras de preços de compra.
- **Isolamento de Segurança:** Unidades que operam sem controle de estoque (`useStock: false`) são blindadas contra alterações acidentais, ocultando painéis e abas de relatórios de forma 100% dinâmica.
- **Logs de Auditoria Imutáveis:** Rastreabilidade total contendo operador responsável, data/hora, produto, quantidade e categoria do descarte (Quebra, Vencimento, Consumo Equipe ou Erro de Preparo).
- **Dashboard Premium:** Análise detalhada com KPIs de impacto financeiro, volume de descarte, impacto no CMV e ranking de perdas por categoria.

### 7. Pacote de Eficiência e Lançamento (v5.1.0)
Focado no dia a dia da equipe, usabilidade rápida em trânsito e controle ativo de penduras.
- **Régua de Cobrança 1-Clique (WhatsApp):** No relatório de devedores, um botão "Cobrar" permite disparar mensagens amigáveis pré-formatadas diretamente via WhatsApp Web sem precisar digitar.
- **Detector de Garçom Esperto (Ticket Médio):** Nova coluna e alternância de ordenação por Ticket Médio de vendas no relatório de equipe, destacando com o selo dourado o atendente mais eficiente em upsell.
- **Badge Mobile de Unidade Ativa:** Badge vermelho piscante no cabeçalho visível em celulares, garantindo que o garçom no salão veja instantaneamente qual terminal está ativo e evite lançar vendas duplicadas no terminal incorreto.

### 8. Previsão de Demanda & Hardening de Permissionamentos (v5.2.0)
Foco em inteligência preditiva local e segurança operacional avançada sem quebra de retrocompatibilidade.
- **Previsão de Movimento (Demand Forecast):** Motor matemático offline que cruza médias históricas do dia da semana e geolocalização do clima local (API Open-Meteo) com um simulador de clima manual e checklist dinâmico de preparo.
- **Matriz de Direitos Híbrida & Retrocompatível:** Implementação de permissões granulares de acesso (estoque, Modo Evento, lembretes de WhatsApp, CMV/margens) acopladas a uma camada de heranças dinâmicas que impede lockouts de usuários legados.

### 9. Assistente do Dono (Premium) (v5.3.0)
Módulo offline de inteligência de negócios e controladoria financeira para o proprietário:
- **Resumo de Saúde Financeira:** Faturamento consumido (líquido de 10% de serviço), CMV consolidado, lucro bruto real e margens de lucro consolidadas de vendas.
- **Matriz BCG de Engenharia de Cardápio:** Classificação dinâmica em quadrantes (Estrelas, Vacas Leiteiras, Quebra-Cabeças, Abacaxis) cruzando mediana de giro e média de margem de lucro. Inclui atualização simplificada de custos pendentes em lote.
- **Precificador de Margem Alvo:** Simulador interativo local para sugerir preços de venda com base no custo de mercadoria para margens de 50%, 60% e 70%.
- **Ranking de Upsell de Atendentes:** Tabela de performance de vendas que classifica a equipe pela proporção de itens de alta margem vendidos, com distintivos automáticos.
- **Alertas de Ruptura e Auditoria:** Avisos preditivos de ruptura de estoque (dias restantes) e alertas de segurança contra anomalias (mesas ociosas sem novos pedidos há mais de 4h, diferenças de caixa > 5% e cancelamentos excessivos de operadores).

### 10. Hospedaria de Quartos & Tempos de Faxina (v5.4.0)
Módulo completo de hospedagem e arrumação integrado ao caixa do bar.
- **Ciclos de Quarto:** Transições de estados (Disponível -> Ocupado -> Limpeza -> Disponível) com acompanhamento em tempo real.
- **Alertas de Alerta Customizáveis:** Alertas visuais piscantes nos cards dos quartos para término de pacotes e blocos de tempo baseados na configuração da unidade.
- **Histórico de Arrumação:** Gravação imutável no banco com cálculo da duração da estadia, valores cobrados e medição de eficiência da equipe de faxina (tempo em minutos de higienização).

### 11. Controle de Ativação de Módulos (v5.4.0)
Habilidade de ligar/desligar módulos por unidade (bar) diretamente nas configurações.
- **Ocultação Reativa:** Ao desativar o módulo de Drinks ou Hospedaria, o sistema oculta dinamicamente abas de consignações no estoque, fichas de receitas no cardápio e seletores de eventos no PDV em tempo de execução.

### 12. Recuperação de Senha Mestre & Atalho Seguro F4 (v5.4.0)
- **Auto-Recuperação do Admin:** Permite redefinir a senha do admin para a padrão `admin123` digitando a Senha Master do Firebase no Login.
- **Remapeamento de Atalho de Checkout:** Atalho global de checkout remapeado de `Espaço` para `F4`, eliminando qualquer conflito com digitação de inputs ou buscas textuais no PDV.

### 13. Clube de Assinaturas e Recorrência (v5.5.0)
- **Vinculação por Telefone/CPF:** O operador vincula o cliente na mesa e o sistema valida o plano ativo.
- **Consumo de Cota Diária:** Desconta a cota diária automaticamente ao lançar o produto cortesia da assinatura.
- **Faturamento Recorrente e CRM:** Painel no Dashboard para simular mensalidades, renovações e estatísticas de faturamento recorrente (MRR).

### 14. Painel de Auditoria & Prevenção de Fraudes (v5.5.0)
- **Score de Risco de Atendente:** Motor que calcula a taxa de cancelamentos após pré-conta impressa, exclusões e quebras de caixa acima de 5% por operador.
- **Simulador de Pré-Conta Térmica:** O PDV permite gerar a pré-conta no formato térmico físico em janela pop-up e trava a auditoria para monitorar qualquer exclusão subsequente.
- **Registro de Alertas Críticos:** Histórico operacional que sinaliza anomalias e erros com marcações cromáticas.

---

## 🔧 Instalação e Desenvolvimento

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/botequista.git

# 2. Instale as dependências
npm install

# 3. Configure o ambiente local
# Crie um arquivo .env ou .env.local na raiz com as chaves do Firebase
cp .env.example .env.local

# 4. Inicie o servidor local
npm run dev
```

> 🔒 **Nota de Segurança & Deploy**:
> - **Desenvolvimento Local:** Mantenha suas credenciais locais nos arquivos `.env` ou `.env.local` (que são ignorados pelo Git).
> - **Produção (Vercel / Hosting):** **Nunca envie arquivos `.env` para o repositório.** Cadastre as variáveis de ambiente (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_DATABASE_URL`, etc. ou seus fallbacks `FIREBASE_API_KEY`, `FIREBASE_URL`) diretamente no painel da sua plataforma de hospedagem (*Vercel > Project Settings > Environment Variables*).


## 📜 Licença

© 2026 Botequista Systems. Todos os direitos reservados.
Distribuído sob licença proprietária para uso comercial restrito.

---

*Designed with Offline-First Architecture, Performance and Business-Critical Reliability in mind.*

---
*Automatic Deployment Test: 2026-06-05*