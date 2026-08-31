import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : color === 'violet' ? 'bg-violet-600' : color === 'orange' ? 'bg-orange-600' : color === 'cyan' ? 'bg-cyan-600' : color === 'pink' ? 'bg-pink-600' : color === 'indigo' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-16 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="inline-block bg-gradient-to-r from-red-600 to-red-800 text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 shadow-xl shadow-red-500/20 animate-pulse">
            Inteligência Botequista, Design System & AI Insights v5.6.0
          </div>
        <h2 className="text-6xl md:text-7xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">
          GUIA <span className="text-red-600">BOTEQUISTA</span> ELITE 🛡️
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-xl leading-relaxed">
          O arsenal de ferramentas para o bar que não aceita nada menos que a excelência.
        </p>
      </div>

      {/* Manual em Cards - Grid 3x3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* 1. Atalhos de Teclado */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-red-500/10 dark:border-red-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">⌨️</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Atalhos Elite</h3>
          </div>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest flex-1">
            <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"><span>[F1]</span> <span className="text-red-600">Venda Rápida</span></p>
            <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"><span>[F2]</span> <span className="text-red-600">Abrir Mesa</span></p>
            <p className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2"><span>[ESC]</span> <span className="text-red-600">Cancelar/Sair</span></p>
            <p className="flex justify-between pb-2"><span>[Espaço]</span> <span className="text-red-600">Fechar Conta</span></p>
          </div>
        </section>

        {/* 2. Operação Saideira & Inteligência */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🍻</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Fluxo de Giro</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black italic">SAIDEIRA:</span> Use <FakeButton color="orange">Repetir Saideira</FakeButton> para adicionar o último item pedido.</p>
            <p>• <span className="text-red-600 font-black italic">MESA TRAVADA:</span> Se o card pulsar em <span className="text-red-600 font-black">vermelho</span> e sugerir a saideira, a mesa está há muito tempo sem consumo. Aja rápido!</p>
            <p>• <span className="text-slate-400 font-black italic">CRONÔMETRO:</span> Cada mesa mostra há quanto tempo está aberta e há quanto tempo foi o último pedido.</p>
          </div>
        </section>

        {/* 3. Inteligência em Tempo Real */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">📈</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Painel Elite</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black italic">TICKET MÉDIO:</span> No Dashboard, acompanhe se o consumo está subindo ou descendo com as setas de tendência.</p>
            <p>• <span className="text-emerald-600 font-black italic">HEATMAP:</span> Visualize as horas de pico para planejar sua escala de funcionários.</p>
          </div>
        </section>

        {/* 4. WhatsApp & Recibos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-cyan-100 dark:border-cyan-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center gap-4 text-cyan-600">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">📱</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Recibos Digitais</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-cyan-600 font-black italic">SEM PAPEL:</span> Ao finalizar uma conta, clique em <span className="font-bold underline">Enviar via WhatsApp</span> para gerar um texto formatado profissional.</p>
            <p>• <span className="text-cyan-600 font-black italic">VALOR:</span> Fortalece a marca e economiza com bobina de impressora.</p>
          </div>
        </section>

        {/* 5. Gestão de Penduras */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all group">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🏷️</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Gestão de Penduras</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black italic">COBRANÇA 1-CLIQUE (v5.1.0):</span> Na aba <span className="italic">Relatórios / Penduras</span>, clique no botão verde <FakeButton color="emerald">Cobrar</FakeButton> ao lado do nome do cliente para disparar uma cobrança amigável pelo WhatsApp Web.</p>
            <p>• <span className="text-violet-600 font-black italic">QUITAÇÃO EM LOTE:</span> Selecione vários devedores de uma vez no checklist e liquide a conta deles em lote clicando em <FakeButton color="slate">Quitar Selecionados</FakeButton>.</p>
          </div>
        </section>

        {/* 6. Segurança de Conta Admin (v4.7.3) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-slate-500 transition-all group">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🛡️</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Segurança Admin</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-slate-900 dark:text-white font-black italic">CONTA MASTER:</span> A conta `admin` é protegida visualmente e funcionalmente. O login não pode ser alterado para evitar perda de acesso.</p>
            <p>• <span className="text-slate-900 dark:text-white font-black italic">LOGOUT GUARD:</span> Adicionamos uma confirmação obrigatória para sair, evitando fechamentos acidentais durante a operação.</p>
          </div>
        </section>

        {/* 7. Engenharia de Lucro (v4.7.3) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">💰</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Lucro Real</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black italic">CMV:</span> Cadastre o custo de cada item para o sistema calcular o seu **Lucro Real** automaticamente nos relatórios.</p>
            <p>• <span className="text-emerald-600 font-black italic">MARKUP:</span> Use os dados de lucro para ajustar preços de forma inteligente, garantindo que nenhum item dê prejuízo.</p>
          </div>
        </section>

        {/* 8. Cardápio Digital Elite (v4.8.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-indigo-500/50 transition-all group">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">📱</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Menu Digital</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-indigo-600 font-black italic">URL DINÂMICA:</span> Use `/menu/NOME-DO-BAR` para um link amigável e profissional para seus clientes.</p>
            <p>• <span className="text-indigo-600 font-black italic">QR CODE & TEMAS:</span> Gere QR Codes em <FakeButton color="indigo">Ajustes</FakeButton> e deixe seus clientes escolherem entre os temas **Claro ou Escuro**.</p>
          </div>
        </section>

        {/* 9. Modo Evento / Festa */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-pink-100 dark:border-pink-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-pink-500/50 transition-all group">
          <div className="flex items-center gap-4 text-pink-600">
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🎉</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Modo Evento</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-pink-600 font-black italic">FLUXO CONTÍNUO:</span> Ative o <FakeButton color="pink">Modo Evento</FakeButton> no PDV para forçar a Venda Rápida contínua. Ideal para dias cheios e baladas onde não há uso de mesas.</p>
          </div>
        </section>

        {/* 10. Happy Hour Automático */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-amber-500/50 transition-all group">
          <div className="flex items-center gap-4 text-amber-600">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🔥</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Happy Hour Inteligente</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-amber-600 font-black italic">AUTOMAÇÃO:</span> No cadastro do produto, defina um preço de Happy Hour, hora de início e fim. O PDV assume o desconto sozinho e exibe um selo promocional piscante. Sem margem de erro pro caixa.</p>
          </div>
        </section>

        {/* 11. Radar de Prejuízo (v4.9.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-red-100 dark:border-red-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">💸</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Radar de Prejuízo</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black italic">MARGENS CRÍTICAS:</span> O Botequista varre os custos (CMV) e vendas. Se um item tiver margem menor que 30% e estiver vendendo bem, ele gera um alerta para o dono reajustar os preços.</p>
          </div>
        </section>

        {/* 12. Smart Stock & Alta Demanda (v4.9.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">📡</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Smart Stock Híbrido</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black italic">COM ESTOQUE:</span> Prevê exatamente em quantas horas o produto esgotará.</p>
            <p>• <span className="text-orange-600 font-black italic">SEM ESTOQUE:</span> Aciona o modo **Alta Demanda (Hot Item)** informando que o produto está saindo muito acima da média, sem quebrar a operação do bar.</p>
          </div>
        </section>

        {/* 13. Monitor de Cozinha (v4.9.5) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-red-500/10 dark:border-red-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🍳</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Monitor de Cozinha</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black italic">CONFIGURAÇÃO:</span> No cadastro do produto, ative a opção <span className="font-bold underline">Enviar para a Cozinha</span>.</p>
            <p>• **SINCRONISMO (🛎️)**: Sempre que um prato ficar pronto na cozinha, todas as telas do bar reproduzem um som de sino e mostram um aviso. O card da mesa no PDV pisca com um sino.</p>
            <p>• **HISTÓRICO🔒**: As últimas 15 comandas fechadas permanecem visíveis na aba de "Prontos" por 2h com travas de segurança para auditoria.</p>
          </div>
        </section>

        {/* 14. Gestão de Perdas & Desperdício (v5.0.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-rose-100 dark:border-rose-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-rose-500/50 transition-all group">
          <div className="flex items-center gap-4 text-rose-600">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🚨</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Controle de Desperdício</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-rose-600 font-black italic">REGISTRO DE PERDAS:</span> No controle de estoque, registre perdas por **Quebra, Vencimento, Consumo Equipe ou Erro de Preparo** com o custo real de descarte salvo na hora.</p>
            <p>• <span className="text-rose-600 font-black italic">PAINEL DE DESPERDÍCIO:</span> Acesse a nova aba em Relatórios para ver os maiores "ralos de caixa", estatísticas de CMV e o log de auditoria detalhado.</p>
            <p>• <span className="text-rose-600 font-black italic">ISOLAMENTO SEGURO:</span> Bares com estoque desativado (`useStock: false`) têm as abas e o controle ocultados e bloqueados automaticamente.</p>
          </div>
        </section>

        {/* 15. Detector de Garçom Esperto (v5.1.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🏆</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Garçom Esperto</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black italic">TICKET MÉDIO (v5.1.0):</span> Na aba <span className="italic">Relatórios / Equipe</span>, clique no seletor <FakeButton color="blue">Ticket Médio 💡</FakeButton> para reordenar o ranking pelo valor médio por venda em vez do faturamento bruto.</p>
            <p>• <span className="text-blue-600 font-black italic">RECONHECIMENTO:</span> O sistema destaca com o badge de prestígio **🏆 Garçom Esperto** o profissional mais eficiente em vendas cruzadas e adicionais.</p>
          </div>
        </section>

        {/* 16. Previsão de Movimento (v5.2.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🌤️</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Previsão Operacional</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black italic">CLIMA & MOVIMENTO:</span> O algoritmo analisa a média histórica de vendas para o dia da semana e cruza com a previsão do tempo (Open-Meteo) para antecipar a demanda do salão.</p>
            <p>• <span className="text-orange-600 font-black italic">CHECKLIST PREMIUM:</span> Gera uma lista inteligente de preparação (gelo, insumos, escala) permitindo também ao usuário simular cenários manualmente.</p>
          </div>
        </section>

        {/* 17. Matriz de Direitos Híbrida (v5.2.0) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all group">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🔑</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Matriz de Direitos</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black italic">RETROCOMPATIBILIDADE:</span> Uma camada de herança protetora dinâmica evita quebras para contas legadas (que herdam de permissões pai automaticamente).</p>
            <p>• <span className="text-violet-600 font-black italic">CONTROLE GRANULAR:</span> Restrinja individualmente o Modo Evento, lançamentos/perdas de estoque, cobranças via WhatsApp e relatórios financeiros (CMV/lucro bruto).</p>
          </div>
        </section>

        {/* 18. Assistente do Dono (Premium) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-amber-500/50 transition-all group">
          <div className="flex items-center gap-4 text-amber-600">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🧠</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Assistente do Dono</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-amber-600 font-black italic">MATRIZ BCG & CUSTOS:</span> Classifica produtos dinamicamente em Estrelas, Vacas Leiteiras, Quebra-Cabeças e Abacaxis. Permite atualizar custos pendentes em lote.</p>
            <p>• <span className="text-amber-600 font-black italic">UPSELL & AUDITORIA:</span> Acompanhe o ranking de conversão de upsell dos garçons e receba alertas de segurança (comandas inativas, cancelamentos de operadores e quebras de caixa).</p>
          </div>
        </section>

      </div>

      {/* Seção FAQ */}
      <div className="bg-white dark:bg-slate-900 rounded-[50px] border border-slate-200 dark:border-slate-800 p-12 space-y-10 shadow-sm relative">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black">?</div>
           <h3 className="text-3xl font-black uppercase tracking-tighter italic">FAQ Operacional Elite</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Por que o botão do produto está piscando?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Isso é um alerta de **Estoque Crítico**. Significa que o estoque desse produto está abaixo de 5 unidades. Reponha o quanto antes!
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Como funciona o Monitor de Produção?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Ele junta os pedidos de todas as mesas que possuem itens de cozinha. O cozinheiro clica em "Pronto" para avisar o garçom. O garçom vê o sino 🛎️ piscando na mesa do PDV e ouve o aviso sonoro instantaneamente para retirar o pedido.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Como mudar a ordem da curva ABC?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Nos relatórios de produtos, use o seletor no topo para alternar entre **Volume** (o que mais sai) e **Faturamento** (o que mais traz dinheiro).
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Consigo usar o Botequista só pelo teclado?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Quase tudo! Use as teclas de função <span className="font-bold">F1 e F2</span> para fluxos de venda e as setas para pesquisar produtos. É muito mais rápido no balcão.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">A mesa ficou vermelha e com alerta de ociosidade, o que fazer?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Envie o garçom até a mesa. Pergunte se "deseja mais uma rodada". Isso evita que o cliente ocupe lugar sem consumo e gera mais lucro.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-orange-600">O que é o alerta de "Produto Parado" no estoque?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               É a inteligência do Botequista avisando que aquele item não vende há mais de 15 dias. Ele ajuda você a identificar capital parado ou pratos que ninguém mais pede.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">O que significa o tempo (H) ao lado do estoque?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               É o nosso **ETA (Estimated Time of Arrival)**. Baseado na velocidade de venda da última hora, o sistema calcula em quanto tempo o produto deve esgotar. Use isso para repor antes de acabar!
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-emerald-600">Como funciona a Reposição Inteligente?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Na aba de **Inventário / Reposição**, o sistema sugere a quantidade exata para comprar para cobrir os próximos 7 dias. Você pode mandar essa lista direto no WhatsApp do seu fornecedor.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Por que não consigo ver as senhas dos usuários?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Implementamos um protocolo de segurança (v4.7) que impede a exibição de senhas em texto puro. Isso protege as contas contra curiosos e garante a privacidade da equipe.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-indigo-600">Como funciona o link amigável do cardápio?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Agora você pode usar `/menu/meu-bar` em vez de IDs complicados. O sistema busca automaticamente o nome da sua unidade e apresenta o cardápio correto com suporte a temas.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-rose-600">Como funciona o Registro de Perdas & Desperdício?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               No estoque, você pode registrar descartes de mercadorias. O sistema grava o preço de custo histórico no ato, e agrupa tudo em um painel premium nos relatórios que mostra o prejuízo total em R$, as fatias de perdas de cada canal e o ranking por produto.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Por que o nome do bar está piscando no topo do celular?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                Este é o **Badge Mobile de Unidade Ativa** (v5.1.0). Ele foi desenhado para que atendentes correndo pelo salão em dias cheios saibam instantaneamente em qual unidade ou caixa o dispositivo está ativo, eliminando erros de lançamentos duplicados ou incorretos entre terminais.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-amber-600">Como funciona o Assistente do Dono (Premium)?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Este módulo offline-first consolida faturamento, CMV e lucros reais, exibe a matriz BCG de cardápio, sugere preços ideais para margens de 50%/60%/70% e audita anomalias (mesas abertas inativas, cancelamentos excessivos de funcionários e diferenças de caixa).
             </p>
          </div>
        </div>
      </div>

      {/* Mandamentos - Footer Section */}
      <div className="bg-slate-900 text-white p-12 rounded-[60px] shadow-2xl space-y-10 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[120px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
              <span className="text-red-500 text-5xl">★</span> Mandamentos Operacionais
            </h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest pl-12">Protocolo de Segurança v5.3.0 Elite</p>
          </div>
          <div className="bg-red-600 px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-500/20">Elite v5.3.0</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-xs font-black uppercase tracking-[0.1em] opacity-90 relative z-10">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">01</span>
            Seja rápido. Use os atalhos de teclado sempre que possível.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">02</span>
            Saideira é lucro. Repita o pedido com um clique no PDV.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">03</span>
            Fiado controlado. Use a Quitação em Lote para manter a gaveta organizada.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">04</span>
            Inteligência é poder. Antecipe rupturas com o Radar de Reposição e nunca perca uma venda por falta de gelada.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;