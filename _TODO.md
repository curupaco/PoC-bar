# Anotações de Desenvolvimento (Botequista)

Este arquivo é destinado a anotações rápidas sobre próximas features, correções a serem feitas e ideias de melhorias. Ele não será exposto no sistema e nem na landing page.

---

## Segurança & Infraestrutura

### Segurança de Banco de Dados (v4.5)
- **Regras de Segurança RTDB:** O banco de dados utiliza regras de acesso estritas que bloqueiam leitura/escrita global.
- **Restrição por Identidade:** Apenas a conta autenticada configurada no sistema (`curupaco@gmail.com`) possui permissão para ler e gravar nos nós `users`, `units`, `franchises` e no armazenamento de dados das unidades (`data/units/*`).
- **Proteção de Raiz:** A raiz do banco de dados (`/`) é protegida contra leitura, ocultando a estrutura do banco para usuários não autorizados.

### Segurança & Acessibilidade (v4.7) [FEITO]
- [x] **Acessibilidade A1/A2:** Implementação de aria-labels e associação de labels/inputs em todo o sistema.
- [x] **Privacidade de Senhas:** Removida exibição de senhas e implementada edição segura no UserManagement.
- [x] **Proteção Admin:** Bloqueada edição do login 'admin' para evitar lockouts.
- [x] **Engenharia de Cardápio (CMV):** Cadastro de custo e cálculo de lucro real (v4.7.3).
- [x] **Módulo de Gratificação:** Taxa de serviço configurável (10%) no PDV (v4.7.3).
- [x] **Cardápio Digital QR:** Rota `/menu` para menu minimalista sincronizado (v4.7.3).

---

## 🚀 Features Próximas (A Fazer)

### Gestão Financeira & Inteligência de Negócio

1. [x] **Radar de Prejuízo** [FEITO] (produto que parece vender mas dá pouco lucro)
   - Mostrar quais produtos Vendem muito, mas geram pouca margem
   - Sugestão automática de promover itens mais lucrativos
   - Complexidade: baixa

2. [x] **Radar de Crescimento do Bar** [FEITO]
   - Evolução semanal/mensal (% vendas, ticket médio)
   - Alerta de queda vs período anterior
   - Transforma o sistema em painel de negócio

3. **Detector de Cliente VIP** (sem cadastro)
   - Identifica pagantes frequentes (3x/semana com ticket alto)
   - Sugestão de oferecer cortesia ocasional
   - Donos amam reconhecer clientes fiéis

4. **Previsão de Movimento do Dia**
   - Usa histórico + dia da semana + clima
   - Exemplo: "Sexta com calor: movimento esperado ALTO"
   - Sugestão: Preparar +40 long neck, +2 caixas de gelo

5. **Régua de Cobrança Educada para "Pendura"**
   - Sistema gera mensagens de WhatsApp semi-prontas e educadas para cobrar o fiado
   - Avisa clientes que têm conta vencida sem constranger o dono
   - Reduz a inadimplência de forma automatizada e profissional

6. **Clube de Assinaturas do Boteco (Recorrência)**
   - Módulo para o bar vender planos de assinatura mensais (ex: 1 chopp por dia, 1 drink por semana, etc).
   - Cadastro flexível de tipos de planos e produtos vinculados, não restrito a apenas uma bebida.
   - Gera receita recorrente previsível, garantindo caixa mesmo em dias fracos.
   - Fideliza o cliente e incentiva a venda cruzada (cliente vai buscar o drink do plano e pede uma porção).
   - Complexidade: alta

---

### Gestão de Estoque & Compras

5. [x] **Alerta de Produto Acabando (Smart Stock Warning)** [FEITO]
   - "Heineken Long Neck vai acabar em ~35 vendas (~3h)"
   - Calcula velocidade média de venda por hora
   - UI simples com alerta visual
 
6. [x] **Sugestão de Reposição Automática** [FEITO]
   - Sugestão de compra semanal baseada em média dos últimos 7 dias
   - Exemplo: "Heineken: +120, Original: +80, Carvão: +6 Sacos"
   - Não precisa IA — só médias simples
 
7. [x] **Detector de Produto Morto** [FEITO]
   - Identifica itens que não vendem há X dias
   - Mostra última venda, estoque atual
   - Sugestão: promoção ou remoção do cardápio
   - Donos adoram limpar cardápio

8. **Registro de Perda & Desperdício de Estoque**
   - Módulo simples no estoque para registrar perdas (quebras, consumo interno, vencimento)
   - Permite manter estoque físico e contábil 100% integrados
   - Complexidade: baixa

---

### Experiência do Cliente & Operações

8. [x] **Modo Happy Hour Automático** [FEITO]
   - Ativa em horário configurado (ex: 18:00)
   - Produtos mudam preço automaticamente
   - Diferencial: ativa sozinho, sem intervenção
   - Complexidade: baixa

9. **Foto do Produto no PDV**
   - Imagens dos produtos na tela do operador
   - Ajuda novos funcionários a identificar itens rapidamente
   - Complexidade: quase zero

10. [x] **Modo Evento / Festa** [FEITO]
    - Ativa modo que ignora mesas, tudo vira venda expressa
    - Perfeito para festivais, open bar, eventos
    - Muito simples de implementar

11. [x] **QR Code da Mesa** [FEITO v4.7.3]
    - Cliente escaneia e vê conta ou paga
    - MVP: QR mostra conta, garçom ganha tempo

12. [x] **Resumo Diário Automático (WhatsApp)** [FEITO]
    - Gera resumo do dia no fim do turno
    - Envia para WhatsApp: faturamento, mesas, ticket médio, top produto, garçom destaque

13. [x] **Ticket Médio por Mesa** [FEITO]
    - Dashboard: "Ticket médio hoje: R$84, ↑ +12% vs ontem"

14. [x] **Top Combos Vendidos** [FEITO]
    - Detecta automaticamente: "Heineken + Batata Frita"
    - Sugestão de criar combos promocionais

15. [x] **Ranking de Produtos por Lucro** [FEITO v4.7.3]
    - Curva ABC por faturamento + custo = lucro real
    - Dashboard: "Top produtos que mais dão lucro"

16. [x] **Tempo Médio de Mesa** [FEITO]
    - "1h 34min" ou "Mesa 12: 2h 20min"
    - Ajuda a medir giro das mesas

17. **QR Code Pix Dinâmico no PDV**
    - Exibe um QR Code na tela de pagamento do Pix com o valor exato da conta
    - Evita erros de digitação e filas no caixa
    - Complexidade: baixa

18. **Mensagem de Fidelidade Pós-Venda (WhatsApp)**
    - Permite enviar agradecimento rápido via WhatsApp Web após fechamento completo da venda
    - Oferece benefício de cortesia automático para estimular o retorno do cliente
    - Complexidade: baixa

---

### Auditoria & Segurança Antifraude

17. **Detector de Comanda/Caixa Suspeito**
    - 3 cancelamentos seguidos por operador
    - Exclusão após pagamento
    - Mesa fechada com valor reduzido após consumo
    - Previne fraude interna (raro em POS)

18. [x] **Detector de Mesa Travada** [FEITO]
    - Mesa aberta há muito tempo sem consumir
    - Sugestão: Oferecer nova rodada
    - Aumenta faturamento

---

### Métricas & Analytics

19. **Detector de Garçom Esperto**
    - Ranking não por vendas totais, mas por ticket médio
    - Identifica quem vende adicionais, sobremesas
    - Ferramenta de treinamento de equipe

20. [x] **Sugestão de Combo Inteligente** [FEITO]
    - Detecta combinações frequentes: "Heineken + Batata"
    - Sugestão: "Criar combo Heineken + Batata por R$18"
    - Aumenta ticket médio naturalmente

21. [x] **Detector de Horário Morto** [FEITO]
    - Identifica horários fracos (ex: Segunda 16h-18h com 22% ocupação)
    - Sugestão automática: "Happy hour nesse horário"
    - Consultoria automática de negócio

22. [x] **Feed de Insights Automáticos** [FEITO]
    - Dashboard diário: "Heineken vendeu 37% mais", "Mesa média R$92"
    - Faz o dono sentir que "o sistema pensa por mim"

23. **Assistente do Dono** (Premium)
    - Insights consolidados do dia
    - Parece IA avançada, mas é simples
    - Pode virar assinatura premium

---

## 🐛 Correções & Bugs (A Fazer)

- [x] Vínculo de novos bares e fracking não funciona [FEITO]
- [x] Links de rodapé não funcionam na LP [FEITO]
- [x] LP feia com abordagem ELITE. Mudar para "Simplicidade + Inteligência". [FEITO]

### Bugs Identificados na Revisão de Código (Maio/2026) [FEITO]

- [x] **[CRÍTICO] useAppStore.ts:91** - Typo em stockBalances [FEITO]
  ```tsx
  const balances: Record<string, number> = {};  // ERRO:Record<string
  ```
  Deveria ser: `Record<string, number> = {};` (sem vírgula após string)

- [x] **[CRÍTICO] ShiftControl.tsx:100** - Variável currentDifference usada sem valor inicial [FEITO]
  - Verificar se `openingBalance` e `expectedCashInDrawer` estão sendo passados corretamente para o modal de conferência
  - O cálculo parece existir mas precisa validar se não há referência a variável não inicializada

- [x] **[ERRO] Reports.tsx:4** - Importação não utilizada [FEITO]
  ```tsx
  import { getFirebaseToken, loadFromFirebase } from '../../services/firebaseService';
  ```
  - Parece estar em uso (linha 53, 62) mas precisa verificar se o serviço existe

- [x] **Fluxo de Fechamento de Turno** - Verificar se a lógica de "diferença visível" está funcionando em tempo real (C4) [FEITO]

---

## 🔧 Melhorias de UX Pendentes

### A - Acessibilidade BÁSICA

- [x] A4: Foco de teclado não visível em elementos interativos
  - Adicionado focus visível globalmente via index.css
- A5: Modais sem foco inicial garantido
  - Usar useEffect com ref.current?.focus()
- A6: Erros em campos sem aria-invalid e aria-describedby
  - Adicionar aria-invalid="true" e aria-describedby

### B - Feedback ao Usuário

- [x] B2: Mensagens de erro não descritivas
  - Mensagens no POSPaymentPanel foram reformuladas para serem mais claras e contextuais.
- [x] B3: Loading sem mensagem contextual
  - Mensagem de loading no App.tsx detalhada para "Sincronizando dados e produtos...".
- B4: Falha silenciosa em operações async
  - Adicionar try-catch com showFeedback

### C - Fluxos de Usuário e Interação

- [x] C1: Fluxo de pagamento confuso para vendas múltiplas
  - Adicionar indicador "PAGAMENTO COMPLETO ✓"
- C3: Atalho de teclado "Espaço" conflitante
  - Considerar F4 ou Ctrl+Enter
- C4: Fechamento de turno sem "diferença" visível
  - Toggle opcional para revelar diferença em tempo real
- [x] C5: Seleção de produto no inventário por texto [FEITO]
  - Substituir por dropdown com busca
- C6: Filtro de datas não mostra datas selecionadas claramente
  - Destacar período com badge maior
- [x] C7: Edição de senha sem saber a atual
  - Toggle "Alterar senha" só exibe campo quando marcado
- [x] C9: Atalhos de teclado não indicados
  - Adicionar painel de "Atalhos Disponíveis" acessível via ícone ?
- C10: Fluxo de quitação de pendura automático
  - Mostrar resumo antes de abrir tela de pagamento

### D - Formulários e Validação

- D2: Validação de abertura de turno permite zero
  - Confirmar "Abrir turno sem fundo?"
- D5: Input de quantidade aceita valores decimais inconsistentes
  - Usar regex mais robusta: /^-?\d*[.,]?\d*$/

### E - Responsividade e Layout

- [x] E1: Sidebar não colapsa corretamente em tablets
  - Adicionada transição suave de 300ms no overlay e container principal.
- [x] E3: Modal de payment panel em mobile sem back button [FEITO]
  - Adicionar header com "X" e "Voltar" claros
- E4: Header não mostra nome da unidade em mobile
  - Mostrar nome em texto maior ou badge destacado

### F - Padrões de UI Inconsistentes

- F1: Estilo de botões inconsistente
  - Criar componente Button variante "primary/secondary/danger"
- F3: Cores de feedback inconsistentes
  - Definir paleta: erro=red-600, sucesso=emerald-600, warning=amber-500
- F4: Modais com tamanhos diferentes
  - Padronizar: max-w-md principais, max-w-sm para.confirmações
- F5: Ícones misturados (Emoji vs SVG)
  - Escolher padrão SVG, manter emoji só decorativo
- F6: Nomenclatura de abas inconsistente
  - Uniformizarpara：上海ercase
- F7: Ordem de botões de ação inconsistente
  - Padronizar: Primário=direita, Secundário=esquerda
- F8: z-index arbitrários
  - Definir escala: modal=50, toast=100, tooltip=200

### G - Experiências Frustantes/Confusas

- G3: Dados de exemplo muito grandes (5000 vendas)
  - Implementar paginação ou "carregar mais"
- G4: Seleção de data em Reports reset ao trocar de aba
  - Manter estados no nível do componente
- [x] G5: Produtos sem estoque aparecem no POS
  - Adicionada opacidade e badge "ESGOTADO" apenas se controle de estoque estiver ativo.
- G7: Navegação entre tabs perde scroll position
  - Armazenar scroll position em ref
- [x] G10: Botão "Ver logs de sincronização" não funcional [FEITO]
  - Implementar modal/log ou remover botão
- [x] G11: Teclado numérico mobile cobre o campo [FEITO v4.7.4]
  - Ajustado modais de estoque para se comportarem como Bottom-Sheets elegantes que se posicionam perfeitamente acima do teclado virtual.

---

## 💡 Ideias e Debates

- [x] Criar live demo para a landing page [FEITO]
- Assinatura premium: Assistente do Dono com insights diários

---

## Priorização Recomendada

### 1. Críticos (Alta Prioridade)
- Gestão Financeira: Radar de Prejuízo, Crescimento do Bar
- Estoque: Alerta de Produto Acabando, Sugestão de Reposição
- Auditoria: Detector de Comanda Suspeito

### 2. Altos Impacto (Operações Diárias)
- Experiência: Modo Happy Hour, Foto do Produto, Modo Evento
- Analytics: Detector de Garçom, Sugestão de Combo
- UX: Flujos de pagamento, Fechamento de turno

### 3. Médios (Consistência)
- UI: Padrões de botões, cores, z-index
- UX: Atalhos, modais, responsividade

### 4. Baixos (Polimento)
- Formulários: validação, inputs
- Experiências: scroll position, logs

---

## LandigPage
🚀 Funcionalidades que o seu Boteco precisa (e o Botequista entrega)
1. Adeus ao Caderninho: Módulo "Pendura" Profissional
Gerencie o famoso "fiado" com segurança. Tenha o histórico de consumo de cada cliente da casa e saiba exatamente quem deve o quê, sem o risco de perder a folha do caderno ou esquecer de anotar aquela última dose.

2. Divisão de Conta sem Estresse
Acabe com a calculadora na hora de fechar a mesa. O Botequista divide a conta por pessoa ou por itens específicos com apenas dois cliques. Mais agilidade para o seu caixa e menos fila para os seus clientes.

3. Lançamento em "Tempo de Gole"
Velocidade é tudo no balcão. Nossa interface foi desenhada para ser mais rápida que a caneta: registre pedidos, rodadas duplas e favoritos de forma instantânea, sem travar o atendimento.

4. Fechamento de Caixa "Papo Reto"
Saiba exatamente quanto entrou em dinheiro, Pix e cartão. Relatórios simples e diretos para você fechar o dia em minutos, com a conferência exata do que foi vendido versus o que está na gaveta.

5. Gestão de Mesas e Comandas em Tempo Real
Tenha o controle total do seu salão em uma única tela. Saiba quais mesas estão há muito tempo sem pedir nada e quais já estão prontas para o fechamento, otimizando o giro do seu boteco.

Dica de "Copy" para o topo da página:
"O Botequista: Tão simples quanto o seu caderninho, mas com a inteligência que o seu negócio precisa."


---

## 🔒 Segurança & Auditoria (Melhorias Futuras)

### Firebase Rules
- Exportar regras para versionamento:
  ```
  firebase database:get /.settings/rules.json > database/rules.json
  ```
- Adicionar ao repo para controle de versão
- Criar pipeline de validação no CI/CD

### Hardening Recomendado
- **Centralizar verificação de admin:** Criar hook `useIsAdmin()` para evitar checagem `username === 'admin'` dispersa no código
- **Rate limiting:** Adicionar controle de frequência nos endpoints de API (`/api/reports`, `/api/debtors`)
- **Content Security Policy:** Adicionar no vite.config.ts para prevenir XSS
- **Sanitização de localStorage:** Usar prefixo consistente (ex: `btq_`) para todas as chaves

### Auditoria
- Adicionar logs de auditoria para mudanças críticas
- Configurar alertas no Firebase para operações suspectas

---
*Nota: Ao concluir um item, marque como `[x]`*
*Ao concluir todos os itens de uma categoria, sinalize a categoria como [FEITO].*
