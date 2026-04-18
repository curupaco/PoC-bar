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
           Elite Intelligence Protocol v4.4
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
            <h3 className="text-xl font-black uppercase tracking-tight italic">Quitação em Lote</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black italic">BULK ACTION:</span> Na aba <span className="italic">Relatórios / Penduras</span>, selecione vários devedores de uma vez e clique em <FakeButton color="slate">Quitar Selecionados</FakeButton>.</p>
          </div>
        </section>

        {/* 6. Segurança de Turno */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-slate-500 transition-all group">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl font-black">🛡️</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Auto-Backup</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-slate-900 dark:text-white font-black italic">PROTEÇÃO:</span> Ao fechar cada turno, o sistema solicitará que você baixe um backup <span className="font-mono">.json</span>.</p>
            <p>• <span className="text-slate-900 dark:text-white font-black italic">HÁBITO:</span> Sempre clique em <span className="font-bold">Gerar Backup</span> para nunca perder sua história.</p>
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
               Envie o garçom até a mesa. Pergunte se "deseja mais uma rodada". Isso evita que o cliente ocupe lugar sem consumir e gera mais lucro.
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
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest pl-12">Protocolo de Segurança v4.3 Elite</p>
          </div>
          <div className="bg-red-600 px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-500/20">Elite v4.3</div>
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
            Segurança em 1º lugar. Nunca pule o backup ao fechar o turno.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;