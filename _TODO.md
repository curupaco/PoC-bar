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

1. **Radar de Prejuízo** (produto que parece vender mas dá pouco lucro)
   - Mostrar quais produtos Vendem muito, mas geram pouca margem
   - Sugestão automática de promover itens mais lucrativos
   - Complexidade: baixa

2. **Radar de Crescimento do Bar**
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

---

### Gestão de Estoque & Compras

5. **Alerta de Produto Acabando (Smart Stock Warning)**
   - "Heineken Long Neck vai acabar em ~35 vendas (~3h)"
   - Calcula velocidade média de venda por hora
   - UI simples com alerta visual

6. **Sugestão de Reposição Automática**
   - Sugestão de compra semanal baseada em média dos últimos 7 dias
   - Exemplo: "Heineken: +120, Original: +80, Carvão: +6 Sacos"
   - Não precisa IA — só médias simples

7. **Detector de Produto Morto**
   - Identifica itens que não vendem há X dias
   - Mostra última venda, estoque atual
   - Sugestão: promoção ou remoção do cardápio
   - Donos adoram limpar cardápio

---

### Experiência do Cliente & Operações

8. [x] **Modo Happy Hour Automático**
   - Ativa em horário configurado (ex: 18:00)
   - Produtos mudam preço automaticamente
   - Diferencial: ativa sozinho, sem intervenção
   - Complexidade: baixa

9. **Foto do Produto no PDV**
   - Imagens dos produtos na tela do operador
   - Ajuda novos funcionários a identificar itens rapidamente
   - Complexidade: quase zero

10. [x] **Modo Evento / Festa**
    - Ativa modo que ignora mesas, tudo vira venda expressa
    - Perfeito para festivais, open bar, eventos
    - Muito simples de implementar

11. **QR Code da Mesa** [FEITO v4.7.3]
    - Cliente escaneia e vê conta ou paga
    - MVP: QR mostra conta, garçom ganha tempo

12. **Resumo Diário Automático (WhatsApp)** [FEITO]
    - Gera resumo do dia no fim do turno
    - Envia para WhatsApp: faturamento, mesas, ticket médio, top produto, garçom destaque

13. **Ticket Médio por Mesa** [FEITO]
    - Dashboard: "Ticket médio hoje: R$84, ↑ +12% vs ontem"

14. **Top Combos Vendidos** [FEITO]
    - Detecta automaticamente: "Heineken + Batata Frita"
    - Sugestão de criar combos promocionais

15. **Ranking de Produtos por Lucro** [FEITO v4.7.3]
    - Curva ABC por faturamento + custo = lucro real
    - Dashboard: "Top produtos que mais dão lucro"

16. **Tempo Médio de Mesa** [FEITO]
    - "1h 34min" ou "Mesa 12: 2h 20min"
    - Ajuda a medir giro das mesas

---

### Auditoria & Segurança Antifraude

17. **Detector de Comanda/Caixa Suspeito**
    - 3 cancelamentos seguidos por operador
    - Exclusão após pagamento
    - Mesa fechada com valor reduzido após consumo
    - Previne fraude interna (raro em POS)

18. **Detector de Mesa Travada** [FEITO]
    - Mesa aberta há muito tempo sem consumir
    - Sugestão: Oferecer nova rodada
    - Aumenta faturamento

---

### Métricas & Analytics

19. **Detector de Garçom Esperto**
    - Ranking não por vendas totais, mas por ticket médio
    - Identifica quem vende adicionais, sobremesas
    - Ferramenta de treinamento de equipe

20. **Sugestão de Combo Inteligente**
    - Detecta combinações frequentes: "Heineken + Batata"
    - Sugestão: "Criar combo Heineken + Batata por R$18"
    - Aumenta ticket médio naturalmente

21. **Detector de Horário Morto**
    - Identifica horários fracos (ex: Segunda 16h-18h com 22% ocupação)
    - Sugestão automática: "Happy hour nesse horário"
    - Consultoria automática de negócio

22. **Feed de Insights Automáticos**
    - Dashboard diário: "Heineken vendeu 37% mais", "Mesa média R$92"
    - Faz o dono sentir que "o sistema pensa por mim"

23. **Assistente do Dono** (Premium)
    - Insights consolidados do dia
    - Parece IA avançada, mas é simples
    - Pode virar assinatura premium

---

## 🐛 Correções & Bugs (A Fazer)

- Vínculo de novos bares e fracking não funciona
- [x] Links de rodapé não funcionam na LP (Resolvido na LandingPage2)
- LP feia com abordagem ELITE. Mudar usando outro modelo.

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
- C5: Seleção de produto no inventário por texto
  - Substituir por dropdown com busca
- C6: Filtro de datas não mostra datas selecionadas claramente
  - Destacar período com badge maior
- C7: Edição de senha sem saber a atual
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
- E3: Modal de payment panel em mobile sem back button
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
- G10: Botão "Ver logs de sincronização" não funcional
  - Implementar modal/log ou remover botão
- G11: Teclado numérico mobile cobre o campo
  - Considerar teclado customizado em mobile

---

## 💡 Ideias e Debates

- Criar live demo para a landing page
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

*Nota: Ao concluir um item, marque como `[x]` ou remova da lista.*
*Ao concluir todos os itens de uma categoria, sinalize a categoria como [FEITO].*