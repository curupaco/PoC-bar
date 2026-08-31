# 🍺 Botequista Elite — Gestão de Alta Performance para o Bar da Nova Era

> *Material de apresentação comercial — versão v5.6.0 Design System Base (src/shared/ui/), Padronização Visual Global e Micro-Interações Premium.*
Proceeded with
Implementation Plan
Finalizei com sucesso todo o processo de limpeza e higienização de credenciais do repositório local.

Resumo do que foi feito:
Desrastreamento de arquivos sensíveis: Removido o .env.production do Git (sem apagar seu arquivo local).
Atualização do .gitignore: Padrão genérico .env* adicionado para evitar novos vazamentos involuntários.
Refatoração de código: O arquivo 

fetch_units.js
 teve sua chave de API hardcoded substituída por variável de ambiente.
Purga do Histórico do Git: Reescrevemos o histórico de commits utilizando git-filter-repo. O .env.production antigo, as chaves do Firebase e o token do GitHub foram completamente expurgados de todos os commits passados.
Todas as verificações de histórico e de rastreamento retornaram zero ocorrências de segredos.

Você pode conferir o relatório detalhado no artefato 
walkthrough.md
.

TIP

Para atualizar o repositório remoto no GitHub com o histórico limpo, execute no terminal do projeto:

bash
git push origin main --force
O saneamento de segurança e a limpeza do histórico foram finalizados com sucesso!

Se precisar de ajuda com a atualização no GitHub via git push origin main --force ou qualquer outra questão, estou à disposição.

Expressions
Walkthrough
2:33 PM
2:42 PM
O erro ocorreu porque o repositório Git fica dentro da pasta PoC-bar.

Para enviar as alterações para o GitHub, acesse a pasta do projeto primeiro:

bash
cd PoC-bar
git push origin main --force
2:42 PM
2:43 PM
O git-filter-repo remove o remoto (origin) por segurança para evitar que alterações no histórico sejam enviadas acidentalmente antes da conferência.

Para adicionar o remoto origin novamente e fazer o push forçado, execute os dois comandos abaixo dentro da pasta PoC-bar:

bash
git remote add origin https://github.com/curupaco/PoC-bar.git
git push origin main --force
(Caso utilize SSH no GitHub em vez de HTTPS, use: git remote add origin git@github.com:curupaco/PoC-bar.git)

2:43 PM
2:44 PM
O GitHub bloqueou o force push porque a branch main está configurada como Branch Protegida nas configurações do repositório.

Para concluir o envio do histórico limpo, você tem duas opções rápidas:

Opção 1: Desativar temporariamente a proteção no GitHub (Recomendado)
Acesse no navegador: https://github.com/curupaco/PoC-bar/settings/branches
Em Branch protection rules, clique em Edit na regra da branch main.
Marque a opção "Allow force pushes" (Permitir force push) ou desative a regra temporariamente.
Clique em Save changes no final da página.
Execute o comando novamente no seu terminal:
bash
git push origin main --force
Após o envio bem-sucedido, você pode reativar a proteção da branch no GitHub.
Opção 2: Enviar para uma nova branch limpa
Se preferir não alterar as regras da branch main agora:

bash
# 1. Envia a versão limpa para uma nova branch no GitHub chamada 'main-clean'
git push origin main:main-clean
# 2. Depois você pode ir no GitHub e definir 'main-clean' como a nova branch padrão ou substituir a 'main'.


---

## O Problema que Todo Bar Enfrenta

Todo dono de bar já passou por isso:

- O garçom anotou o pedido, mas o cliente jura que pediu outro.
- O caixa fechou errado. Falta dinheiro e ninguém sabe explicar.
- O sistema travou exatamente na hora do rush da sexta.
- A internet caiu e as vendas pararam.
- **O grande gargalo:** O cozinheiro grita que o prato está pronto, mas o garçom está longe. O prato esfria, o cliente reclama e a cozinha fica desorganizada.
- **Dúvida cruel:** Qual garçom realmente está trazendo lucro? Quais produtos estão apenas ocupando espaço no estoque? Quando exatamente devo comprar mais cerveja para não faltar no sábado?

O **Botequista Elite (v5.5.0)** foi construído para resolver cada um desses problemas — com tecnologia de ponta e inteligência de dados que você só encontraria em softwares de multinacionais.

## Novidades da Versão 5.5.0 Elite 🚀

### 👤 Clube de Assinaturas e Recorrência (CRM) 💎
- **Fidelização com Recorrência:** Criação de planos de assinatura de bebidas/chope com mensalidade recorrente (projetando MRR).
- **Consumo de Cota Diária Inteligente:** Vinculação de clientes por CPF/Telefone no PDV. Lançamento automático de cortesia (preço R$ 0,00) respeitando a cota diária do plano.
- **Histórico e Gestão de Renovação:** Painel gerencial offline no dashboard que simula renovações com 1-clique e exibe o histórico de consumo em tempo real.

### 🛡️ Painel de Auditoria & Prevenção de Fraudes 💎
- **Score de Risco de Atendente:** Avaliação algorítmica de risco individual por garçom/operador baseado em volume de cancelamentos, exclusões após impressão da conta e diferenças de caixa no turno.
- **Travamento de Pré-Conta:** Ao solicitar a "Pré-Conta" no PDV, o sistema imprime uma fatura térmica física simulada em janela pop-up e dispara o monitoramento de qualquer exclusão subsequente na comanda, gerando logs de alerta crítico instantaneamente.
- **Filtro de Incidentes de Segurança:** Logs de segurança organizados por severidade, permitindo ao dono identificar rapidamente anomalias.

## Novidades da Versão 5.4.0 Elite 🚀

### 🏨 Hospedaria de Quartos & Tempos de Faxina 🧹
- **Cronometragem de Ciclos de Quarto:** O sistema gerencia o ciclo completo (Disponível -> Ocupado -> Limpeza -> Disponível) e armazena registros de estadias e faxinas na nuvem.
- **Alertas de Tempo Dinâmicos:** Permite configurar limites de alerta visual para pacotes e blocos de tempo livre de forma personalizada por unidade de bar.
- **Auditoria de Eficiência:** Mostra no histórico de quartos quanto tempo cada quarto demorou para ser limpo antes de ser liberado novamente para venda.

### 🔌 Liga/Desliga de Recursos por Bar (Módulos Dinâmicos) ⚙️
- **Ativação Customizada:** Ative ou desative os módulos de Hospedaria e Drinks individualmente para cada bar/unidade de forma simples nas configurações.
- **Ocultação de Recursos:** O sistema esconde dinamicamente seções de Consignações, Fichas Técnicas de receitas de drinks e seletores de evento ou modo Open Bar quando os recursos não estiverem ativos.

### 🔑 Esqueci Minha Senha & Atalho F4 de Checkout ⌨️
- **Auto-Recuperação do Admin:** Permite redefinir a senha do admin instantaneamente para o padrão `admin123` digitando a Senha Master do Firebase no Login.
- **Remapeamento de Atalho de Checkout:** Atalho redefinido de `Espaço` para `F4` no PDV para erradicar conflitos com digitação.

---

## Novidades da Versão 5.3.0 Elite 🚀

### 🧠 Assistente do Dono (Premium) (Novo v5.3.0) 💎
- **Conselho de Borda Local:** Reúne 5 novas ferramentas offline de inteligência de negócios para dar controle total de margens e riscos operacionais ao dono do bar, blindado pela permissão `view_financial_costs`.
- **Matriz BCG do Cardápio:** Classifica de forma inteligente e dinâmica todos os produtos em Estrelas, Vacas Leiteiras, Quebra-Cabeças e Abacaxis, revelando as estratégias ideais de vendas para cada item. Inclui atualização simplificada de custos pendentes em lote.
- **Precificador de Margem Alvo:** Permite que você digite o preço de custo do insumo e o sistema calcule de forma imediata o preço ideal de venda e o lucro para margens de 50%, 60% e 70%.
- **Ranking de Conversão de Upsell:** Identifica quais garçons possuem a maior proporção de vendas de itens de alta lucratividade (Estrelas e Quebra-Cabeças) sobre as vendas gerais.
- **Alertas de Ruptura e Fraude:** Avisa o proprietário sobre anomalias no caixa (quebra de caixa > 5%), operadores realizando exclusões excessivas de itens, mesas abertas ociosas sem novos pedidos por mais de 4 horas, e projeção de produtos que esgotarão em breve.

---

## Novidades da Versão 5.2.0 Elite 🚀

### 🔑 Matriz de Permissionamentos Híbrida & Retrocompatível (Novo v5.2.0) 💎
- **Retrocompatibilidade Inquebrável:** Adicionamos uma camada dinâmica de heranças protetoras de direitos de acesso. Contas e operadores criados sob o banco de dados antigo continuam funcionando instantaneamente e herdam direitos das permissões pai sem risco de lockouts.
- **Segurança Granular de Tela:** Bloqueios visualmente amigáveis e desativações individuais para ações críticas como Modo Evento, registro/descarte de perdas de estoque, lembretes/réguas de WhatsApp e relatórios de CMV/Margens.

### 🌤️ Previsão de Movimento do Dia por Clima e Vendas (Novo v5.2.0) 💎
- **Motor Preditivo Offline:** O sistema calcula médias móveis das vendas nos últimos dias agrupados por dia da semana para estimar a tendência básica do movimento.
- **Geolocalização Climática:** Integra-se em tempo real com a API Open-Meteo via geolocalização do navegador para cruzar o clima real com as vendas.
- **Simulador Interativo e Checklist:** Permite ao gerente testar hipóteses climáticas em tempo real e gera uma lista interativa de preparo adaptando os volumes do estoque ao fluxo esperado.

## Novidades da Versão 5.1.0 Elite 🚀

### ⚡ Pacote de Eficiência e Lançamento (Novo v5.1.0) 💎
- **Régua de Cobrança com 1-Clique (WhatsApp):** O painel de "Penduras" agora possui o botão "Cobrar", que gera uma mensagem cordial e amigável direcionando para o WhatsApp Web do cliente, acelerando a recuperação de crédito com 1 toque.
- **Detector de Garçom Esperto (Ticket Médio):** A aba de equipe no dashboard ganhou métricas de Ticket Médio por atendente, ordenação por eficiência de upsell e o badge dourado *🏆 Garçom Esperto* destacando o atendente destaque.
- **Badge Mobile de Unidade Ativa:** Um indicador visual reativo e piscante vermelho foi inserido no topo da tela do celular/tablet, permitindo que a equipe no salão valide na hora em qual terminal está trabalhando.

## Novidades da Versão 5.0.0 Elite 🚀

Chegamos ao nível máximo de performance. Veja o que o Botequista Elite entrega agora:

### 🚨 Registro de Perda & Desperdício de Estoque (Novo v5.0.0) 💎
- **Lógica de Custo Histórico:** O Botequista agora grava o preço de custo histórico no momento exato em que o descarte é lançado. Mesmo que o preço de custo do produto mude no futuro no cadastro de produtos, os relatórios do passado permanecem auditáveis e financeiramente perfeitos.
- **Isolamento de Segurança e Paridade:** Bares que optam por não utilizar controle de estoque (`useStock: false`) são blindados. As abas de estoque nos relatórios e opções de inventário desaparecem em tempo de execução para evitar poluição visual ou lançamentos inválidos acidentais.
- **Logs de Auditoria de Movimentações:** Rastreamento imutável registrando operador, data, hora, tipo de descarte (Quebra, Vencimento, Consumo Equipe ou Erro de Preparo) e dados detalhados.
- **Dashboard Premium de Perdas:** KPIs financeiros dedicados, volume total de descarte, impacto real no CMV e ranking de produtos com maior incidência de perdas categoria a categoria com barras CSS.

### 🍳 Monitor de Cozinha e Produção Inteligente (v4.9.5)
- **Fila de Produção Reativa:** Painel touch-friendly escuro de alto contraste (ideal para visualização à distância no calor da cozinha) que agrupa os pratos a serem preparados por ordem de chegada (FIFO), com cronômetros de tempo de espera.
- **Campainha e Alertas Globais (Ding! 🛎️):** O sistema agora gera o som de um sino físico de metal através de síntese de áudio programática (Web Audio API) e dispara notificações Toast na tela de todos os atendentes logados no exato segundo em que o cozinheiro clica em "Pronto"!
- **Alerta de Retirada no PDV:** O card da mesa no PDV do garçom pisca um sino discreto e animado (🛎️), sinalizando que o prato já está no balcão de entrega e pode ser retirado.
- **Trava de Segurança Financeira (Fechada 🔒):** As comandas recém-fechadas e pagas continuam visíveis na aba de "Prontos" por até 2 horas (limite de 15 tickets) para que a cozinha consulte as saídas. Elas são exibidas com um cadeado e têm a edição bloqueada, impedindo alterações acidentais de status que possam alterar os dados do caixa.
- **Interruptor de Cozinha:** Adicione o toggle "Enviar para a Cozinha" no cadastro de produtos para que apenas os pratos corretos entrem na fila de produção.

### 🧠 Inteligência Competitiva e de Margens (v4.9.0)
- **Radar de Prejuízo:** O Botequista te avisa na hora se a margem de lucro de um item muito vendido caiu abaixo de 30%. Proteja seu fluxo de caixa contra a inflação e reajuste os preços com dados reais.
- **Smart Stock Híbrido:** Alertas de esgotamento preditivo por tempo (ex: "Acaba em 2.4 horas") para produtos com estoque ativo. Se o bar optou por trabalhar sem controle de estoque, o Botequista não atrapalha: ele apenas aponta quais são os itens mais quentes da noite (**Hot Item - Alta Demanda**) para o dono preparar a operação.

### 🎉 Dinâmica de Eventos e Happy Hour (v4.8.1)
- **Happy Hour Automático:** Defina horários e preços promocionais. O PDV muda tudo sozinho, risca o preço antigo e adiciona alertas visuais sem o caixa precisar apertar um botão.
- **Modo Evento (Balada):** Trava o PDV no fluxo de Venda Expressa contínua. Fechou uma venda, a próxima abre na mesma hora. Ideal para picos de movimento intensos onde não se usam mesas.
- **Segurança de Pagamento:** Confirmação visual em verde "PAGAMENTO COMPLETO" quando o saldo zera, cortando erros de troco e fechamento prematuro pela raiz.

### 📱 Cardápio Digital Dinâmico (Novo v4.8)
- **URL Personalizada:** Chega de links complicados. Seu cliente acessa `/menu/Nome-Do-Seu-Bar` — simples, fácil e profissional.
- **Temas Premium:** Cardápio com visual "Elite", suportando modo claro e escuro. Uma experiência visual que valoriza seu bar.
- **Sincronização Atômica:** O que acaba no PDV some na hora do cardápio digital do cliente. Zero frustração.
- **Acesso Rápido:** Atalhos direto no cadastro de bares para você visualizar seu menu com um clique.

### ⚡ Turbo-Operação (Velocidade Extrema)
- **Atalhos Globais:** Opere o sistema sem tocar no mouse. `F1` para Venda Rápida, `Espaço` para fechar a conta. Velocidade de checkout 50% maior.
- **Botão Saideira:** O cliente pediu "mais uma das mesmas"? Repita o último pedido com um único clique.
- **Detector de Mesa Travada (Premium):** O sistema agora não só monitora o tempo, mas avisa exatamente há quanto tempo foi o último pedido. Se a mesa "travar", um pulso vermelho e uma sugestão de "Sugerir Saideira 🍻" aparecem para a equipe.
- **Tempo de Mesa em Tempo Real:** Cada comanda exibe seu cronômetro de abertura, permitindo controle absoluto do giro do salão.
- **QR Code da Mesa:** Cada mesa tem seu próprio QR code. O cliente escaneia e vê a conta ou efetua o pagamento direto pelo celular. O garçom ganha tempo e o cliente não precisa chamar ninguém.

---

## O que é o Botequista?

O Botequista é um **sistema de gestão completo para bares**, que roda direto no navegador — sem instalação, sem mensalidade de app store, sem complicação.

Funciona no celular do garçom, no tablet do caixa e no notebook do dono, **tudo ao mesmo tempo**.

E o melhor: **mesmo sem internet, o bar continua vendendo**.

---

## Por Que o Botequista é Diferente?

### ☁️ Offline-First — O Bar Não Para Nunca

A maioria dos sistemas web para quando a internet cai. O Botequista não.

Toda venda é **salva no dispositivo imediatamente**, com confirmação visual para o operador. Quando a internet volta, tudo é sincronizado automaticamente com a nuvem, sem perder um centavo.

> É o único sistema que trata a internet como opcional, não como requisito.

---

### ⚡ Venda Expressa — Balcão no Ritmo Certo

Para o bar que vende rápido, cada segundo conta. Com um único toque, o sistema abre uma **comanda temporária com código automático** (ex.: `EXPRESSA #A3K7`), pronta para o cliente pagar na hora.

- Sem precisar nomear a mesa.
- Sem risco de "anotar no fiado" por engano — métodos de pendura são bloqueados automaticamente.
- Checkout em 3 cliques.

---

### 🕵️ Conferência Cega — O Caixa à Prova de Erros

O fechamento de caixa no Botequista é **estritamente cego**.
 
 O operador informa o valor físico que contou na gaveta, enquanto os números do sistema ficam **ocultos** por padrão. Não há como "ajustar as contas" antes de enviar para o dono. O sistema registra a diferença real com hora e responsável.
 
 > Se desejar, o dono (Admin) pode clicar em um botão secreto para revelar os valores e auditar em tempo real se a equipe está batendo o caixa corretamente.

---

## Relatórios e Inteligência

| Relatório | O que mostra |
|---|---|
| **Ranking de Equipe** | Performance de vendas por operador — quem traz mais faturamento |
| **Ticket Médio** | Evolução diária e por mesa com comparativo vs período anterior |
| **Heatmap de Fluxo** | Horários de pico e densidade de atendimento |
| **Fechamento de Turno** | Faturamento, formas de pagamento, e **Backup Automático** |
| **Financeiro** | Breakdown por Pix, Cartão, Dinheiro e Fiado |
| **Penduras** | Gestão de dívidas com **Quitação em Massa** |
| **Produtos** | Ranking por Faturamento, Volume ou Lucro Real (**Curva ABC**) |
| **Lucro Real** | Faturamento menos custo de mercadoria (CMV) |
| **Pool de Gorjetas** | Total de gratificação para rateio da equipe |
| **Auditoria** | Linha do tempo de todas as ações críticas em tempo real |

---

### 💰 Tesouraria com Teclado de ATM

Esqueça campos de texto para fazer sangria e suprimento. O Botequista tem um **teclado numérico dedicado**, igual a um caixa eletrônico.

- Digita o valor, confirma — pronto.
- O sistema valida o saldo antes: se não tiver dinheiro na gaveta, a sangria não passa.
- Cada movimentação fica registrada com horário e autor, visível em tempo real.

---

### 👥 Controle de Equipe (RBAC)

Cada funcionário tem seu próprio acesso, com permissões configuráveis pelo dono. Exemplos do que é possível controlar:

- Quem pode **cancelar vendas** — e quem não pode.
- Quem pode **fechar o turno** — e quem só vende.
- Quem pode **ver os relatórios financeiros** — e quem só opera o PDV.
- Quem pode **editar o cardápio** — e quem só consulta.

Mais de **20 permissões granulares** para montar a hierarquia certa para o seu bar.

---

### 🗂️ Cardápio Inteligente com Adicionais e Variações

O cardápio do Botequista suporta:

- **Categorias personalizadas** — Drinks, Petiscos, Cervejas, etc.
- **Grupos de adicionais** — Ponto da carne, tamanho do copo, extras.
- **Vínculos automáticos** — Toda categoria pode ter adicionais padrão.
- **Venda por peso** — Para itens a granel, calcula o peso no checkout.
- **Controle de Estoque Seletivo** — Defina quais itens descontam estoque.
- **Itens favoritos** — Atalhos para os mais vendidos no PDV.

---

### 🏢 Suporte a Múltiplas Unidades e Franquias
   
O Botequista foi pensado para crescer com você. A plataforma suporta **múltiplos pontos de venda** com dados isolados e um **Dashboard de Franquia** centralizado.

- O dono ou franqueador vê todas as unidades em um painel consolidado.
- Cada bar tem seu próprio banco de dados, cardápio e histórico.

---

### Perguntas Frequentes

**O Monitor de Cozinha funciona sem internet?**  
Sim! A fila de preparo e o histórico ficam disponíveis no cache local do dispositivo e se mantêm 100% utilizáveis durante qualquer oscilação de sinal.

**O som da campainha toca em todos os aparelhos?**  
Com certeza! Graças ao sincronismo em tempo real, quando o prato é marcado como pronto, um sinal é emitido para todos os computadores, tablets ou celulares logados na unidade, disparando a campainha física (Ding!) e um pop-up com a mesa correspondente.

**O que é o cadeado na aba de prontos da cozinha?**  
É a trava de **Segurança Financeira**. Quando uma conta de mesa é paga e finalizada no caixa, ela entra no histórico da cozinha sob a sinalização `Fechada 🔒`. O botão de "Desfazer" é bloqueado para impedir que alterações manuais na cozinha descaracterizem a transação e criem furos nos relatórios fiscais do caixa.

---

## Tecnologia Que Você Não Precisa Entender, Mas Pode Confiar

O Botequista é construído com tecnologia de ponta:
- **Offline-First Nativo** — O navegador gerencia o banco de dados local.
- **Sincronização Atômica** — Dados espelhados em milissegundos.
- **Sintetizador Web Audio API** — Campainha acústica de balcão gerada por código.

Tudo isso significa uma solução de nível enterprise — perfeitamente acessível para o seu bar.

---

*Botequista — Sistema de Gestão para Bares v5.3.0 | Junho de 2026*  
*Documento comercial de apresentação. Para documentação técnica, consulte DOCUMENTATION.md*
