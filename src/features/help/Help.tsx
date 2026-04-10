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
          Centro de Conhecimento Operacional
        </div>
        <h2 className="text-6xl md:text-7xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">
          GUIA <span className="text-red-600">BOTEQUISTA</span> PRO 🍺
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium text-xl leading-relaxed">
          Tudo o que você precisa para operar seu bar com precisão cirúrgica e zero desperdício.
        </p>
      </div>

      {/* Manual em Cards - Grid 3x3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* 1. Venda Rápida */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Venda Rápida (⚡)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black italic">CONCEITO:</span> Fluxo para balcão. Abre comanda automática (ex: <span className="font-mono">#EXP-A1</span>).</p>
            <p>• <span className="text-emerald-600 font-black italic">REGRAS:</span> Pagamento imediato. Não permite fiado. Ideal para giro alto.</p>
          </div>
        </section>

        {/* 2. Gestão de Mesas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-red-500/10 dark:border-red-500/5 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Mesas & Comandas</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black italic">COLABORAÇÃO:</span> Múltiplos garçons podem ditar para a mesma mesa. O sync é instantâneo.</p>
            <p>• <span className="text-red-600 font-black italic">PAGAMENTO:</span> Clique em <FakeButton>Pagar</FakeButton> para dividir a conta em vários métodos (Pix + Cartão + Dinheiro).</p>
          </div>
        </section>

        {/* 3. Tesouraria & Modo Cego */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Tesouraria (ATM)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black italic">CONFERÊNCIA CEGA:</span> O operador digita o valor contado sem ver o sistema. Evita "ajustes" indesejados.</p>
            <p>• <span className="text-orange-600 font-black italic">MOVIMENTAÇÃO:</span> Sangrias e Suprimentos usam o teclado numérico estilo caixa eletrônico para agilidade.</p>
          </div>
        </section>

        {/* 4. Inventário Inteligente */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Estoque & Produtos</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black italic">CONTROLE SELETIVO:</span> Ative <span className="italic">"Controlar Estoque"</span> apenas no que for físico. Serviços e taxas não poluem seu inventário.</p>
            <p>• <span className="text-blue-600 font-black italic">BUSCA:</span> Use a lupa no topo do inventário para localizar qualquer SKU em milissegundos.</p>
          </div>
        </section>

        {/* 5. Franquia & Redes */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all group">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Multi-Unidades</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black italic">ISOLAMENTO:</span> Cada unidade é um cofre separado. Dados de faturamento nunca se misturam entre filiais.</p>
            <p>• <span className="text-violet-600 font-black italic">DASHBOARD:</span> O Admin de Franquia vê o faturamento consolidado de toda a rede em um só lugar.</p>
          </div>
        </section>

        {/* 6. Auditoria (Timeline) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-slate-500 transition-all group">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Registro de Auditoria</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-slate-900 dark:text-white font-black italic">RASTREABILIDADE:</span> Cada item deletado ou mesa fechada gera um log com usuário e timestamp.</p>
            <p>• <span className="text-slate-900 dark:text-white font-black italic">SEGURANÇA:</span> Acesse a aba <span className="italic">Histórico / Auditoria</span> para resolver discrepâncias de caixa.</p>
          </div>
        </section>

        {/* 7. Sincronia & Offline */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-cyan-100 dark:border-cyan-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center gap-4 text-cyan-600">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Offline-First</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-cyan-600 font-black italic">PING VERDE:</span> Significa que sua fila local está limpa e sincronizada com a nuvem.</p>
            <p>• <span className="text-cyan-600 font-black italic">TRAVA DE SEGURANÇA:</span> O sistema bloqueará o fechamento da aba se houver dados pendentes de upload.</p>
          </div>
        </section>

        {/* 8. Backups & Gist */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-pink-100 dark:border-pink-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-pink-500/50 transition-all group">
          <div className="flex items-center gap-4 text-pink-600">
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Resgate de Dados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-pink-600 font-black italic">GITHUB SYNC:</span> Configure sua chave do GitHub para backups automáticos em Gist privado.</p>
            <p>• <span className="text-pink-600 font-black italic">EMERGÊNCIA:</span> Se o banco falhar, o botão <FakeButton color="slate">Resgate Interno</FakeButton> recupera o estado salvo no cache do navegador.</p>
          </div>
        </section>

        {/* 9. Relatórios & Exportação */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-indigo-500/50 transition-all group">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Inteligência Financeira</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-indigo-600 font-black italic">ABC DE VENDAS:</span> Saiba quem é o campeão de vendas e qual o item que mais lucra (Margem vs Volume).</p>
            <p>• <span className="text-indigo-600 font-black italic">PNG / PDF:</span> Gere comprovantes digitais de fechamento instantaneamente.</p>
          </div>
        </section>
      </div>

      {/* Seção FAQ */}
      <div className="bg-white dark:bg-slate-900 rounded-[50px] border border-slate-200 dark:border-slate-800 p-12 space-y-10 shadow-sm relative">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-black">?</div>
           <h3 className="text-3xl font-black uppercase tracking-tighter italic">Perguntas Frequentes (FAQ)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Como cancelar um item lançado errado?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Na comanda aberta, clique no ícone de lixeira <span className="text-red-500">🗑</span> ao lado do item. Note que apenas usuários com nível <span className="uppercase text-[10px] font-black">Gerente</span> ou superior podem realizar cancelamentos após o item ser confirmado.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Como dividir a conta entre vários clientes?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               No checkout, selecione a opção <FakeButton color="slate">Múltiplo</FakeButton>. Você poderá lançar partes do valor em Pix, Débito e Dinheiro de forma independente até zerar o saldo da mesa.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">O ponto no topo ficou vermelho. E agora?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Isso indica que sua internet caiu ou o Firebase está instável. <span className="font-black text-slate-900 dark:text-white uppercase">NÃO limpe o cache do navegador!</span> Continue operando normalmente; o Botequista salvará tudo em seu dispositivo e sincronizará assim que a conexão estabilizar.
             </p>
          </div>
          <div className="space-y-3">
             <h4 className="text-lg font-black uppercase italic text-red-600">Por que não consigo ver o faturamento do turno?</h4>
             <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
               Se você é um <span className="uppercase text-[10px] font-black">Operador</span>, o sistema oculta os totais por segurança para permitir a <span className="italic font-bold">Conferência Cega</span>. Apenas o Admin verá a discrepância no fechamento final.
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
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest pl-12">Garanta a integridade do seu bar</p>
          </div>
          <div className="bg-emerald-600 px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">Protocolo de Elite v4.2</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-xs font-black uppercase tracking-[0.1em] opacity-90 relative z-10">
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">01</span>
            Nunca compartilhe senhas ou deixe a aba aberta sem supervisão.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">02</span>
            A Venda Rápida é sua melhor amiga no rush do balcão.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">03</span>
            Sangrias devem ser feitas imediatamente ao atingir o limite da gaveta.
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-red-500/30 transition-colors">
            <span className="text-red-500 text-2xl block mb-4">04</span>
            Gere o backup externo (PNG/PDF) ao final de cada turno.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;