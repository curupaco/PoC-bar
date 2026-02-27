import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-red-500/20">Manual Operacional do Bar</div>
        <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia do Botequista <span className="text-red-600">Pro</span> 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium text-lg">
          Domine a gestão do seu bar. Do lançamento rápido ao controle financeiro avançado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Venda Rápida (NOVO) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Venda Rápida (Balcão)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">Agilidade Total:</span> Clique em <FakeButton color="emerald">⚡ Venda Rápida</FakeButton> para abrir uma comanda automática sem precisar digitar nome. Ideal para água, café ou cerveja no balcão.</p>
            <p>• <span className="text-emerald-600 font-black">Checkout Simples:</span> O modo rápido exige pagamento imediato e não aceita <span className="italic">Pendura</span> ou múltiplos métodos, focando em despachar o cliente em segundos.</p>
          </div>
        </section>

        {/* Card 2: Vendas & Mesas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Gestão de Mesas</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black">Comandas Longas:</span> Use <FakeButton>Abrir Mesa</FakeButton> para clientes que vão consumir por tempo prolongado. Você pode renomear uma Venda Rápida para Mesa se o cliente decidir sentar.</p>
            <p>• <span className="text-red-600 font-black">Atalhos:</span> Produtos ⭐ aparecem no topo. A busca inteligente filtra o cardápio em segundos.</p>
          </div>
        </section>

        {/* Card 3: Engenharia de Cardápio */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Engenharia de Cardápio</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black">Vínculos:</span> Na aba <span className="italic">Vínculos</span>, ligue categorias a menus de opções. Ex: Toda "Dose" pede "Gelo/Limão" automaticamente.</p>
            <p>• <span className="text-blue-600 font-black">Peso:</span> Use <FakeButton color="blue">KG</FakeButton> para itens pesáveis (Petiscos/Buffet).</p>
          </div>
        </section>

        {/* Card 4: Hierarquia & Equipe */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all group">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Hierarquia & Equipe</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black">Operador:</span> Vendas e abertura de turno. Sem acesso a faturamento total.</p>
            <p>• <span className="text-violet-600 font-black">Gerente:</span> Cancela vendas, edita produtos e fecha turnos.</p>
            <p>• <span className="text-violet-600 font-black">Admin:</span> Gestão de franquias, unidades e backups.</p>
          </div>
        </section>

        {/* Card 5: Tecnologia Offline */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-slate-400 transition-all group">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Modo Offline & Sync</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-slate-900 dark:text-white font-black">Sem Internet?</span> Venda normalmente. O sistema guarda tudo e sobe para a nuvem quando a conexão voltar (ponto verde no topo).</p>
          </div>
        </section>

        {/* Card 6: Controle de Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Controle de Fiados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black">Pendura:</span> Ao fechar como <FakeButton color="slate">Pendura</FakeButton>, gera dívida para o cliente. Use a quitação no relatório de Penduras para receber.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Mandamentos do Botequista
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20">Protocolo Operacional v4.0</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Vendas Rápidas não permitem Fiado.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use a Venda Rápida para evitar filas no balcão.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Feche o turno diariamente para manter a agilidade.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Sangrias: Retire excesso de dinheiro para o cofre.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Confira os relatórios de "Penduras" toda segunda-feira.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca compartilhe sua senha pessoal.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;