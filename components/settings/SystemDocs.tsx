import React, { useState } from 'react';

interface SystemDocsProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SystemDocs: React.FC<SystemDocsProps> = ({ showToast }) => {
  const [activePanel, setActivePanel] = useState<'OPER' | 'CAIXA' | 'FIADO' | 'FIN' | 'DICAS'>('OPER');

  const panels = {
    OPER: {
      title: 'Vendas e Mesas',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/20">
             <h4 className="text-sm font-black text-red-600 uppercase mb-3 italic">Lançamento Rápido</h4>
             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Para vender rápido no balcão, não é preciso abrir mesa. Basta clicar no produto e escolher o pagamento. Se for uma conta de mesa, use <strong>"Abrir Mesa"</strong> e dê um nome (Ex: Mesa 04 ou João).
             </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-blue-500 uppercase">Dica: Adicionais</span>
                <p className="text-[11px] text-slate-500 mt-2">Configure o sistema para perguntar se o cliente quer gelo ou limão automaticamente ao clicar em uma bebida.</p>
             </div>
             <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-emerald-500 uppercase">Dica: Peso</span>
                <p className="text-[11px] text-slate-500 mt-2">Para itens vendidos por quilo (porções, buffet), o teclado de gramas facilita o cálculo do preço exato.</p>
             </div>
          </div>
        </div>
      )
    },
    CAIXA: {
      title: 'Controle de Caixa',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      content: (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800">
             <h4 className="text-xs font-black text-white uppercase mb-4 tracking-widest italic">A Conferência Cega</h4>
             <p className="text-xs text-slate-400 leading-relaxed">
                O Botequista não mostra quanto dinheiro deve ter na gaveta antes do funcionário contar. Isso garante que o valor informado seja o real, evitando "ajustes" indevidos. Sobras ou faltas ficam registradas para o dono conferir depois.
             </p>
          </div>
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/20">
             <h5 className="text-[10px] font-black text-blue-600 uppercase mb-2">Sangrias e Suprimentos</h5>
             <p className="text-[11px] text-slate-600 dark:text-slate-400">Tirou dinheiro para pagar o gelo? Registre como <strong>Sangria</strong> na Tesouraria. Adicionou troco? Registre como <strong>Suprimento</strong>. Isso mantém o saldo final impecável.</p>
          </div>
        </div>
      )
    },
    FIADO: {
      title: 'Gestão de Fiados',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      content: (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-8 bg-orange-50 dark:bg-orange-900/10 rounded-[40px] border border-orange-100 dark:border-orange-900/20">
             <h4 className="text-xs font-black text-orange-600 uppercase mb-4 tracking-widest italic">Não perca o controle das Penduras</h4>
             <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ao fechar uma conta como <strong>"Pendura"</strong>, o sistema cria uma dívida para aquele cliente. No módulo de Relatórios, você vê a lista de quem deve e há quanto tempo. Quando o cliente pagar, basta clicar em <strong>"Quitar"</strong> e o sistema gera a entrada no caixa do dia.
             </p>
          </div>
        </div>
      )
    },
    FIN: {
      title: 'Entendendo o Lucro',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      content: (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase">Curva ABC</span>
                <p className="text-[11px] text-slate-500 mt-2">Identifique os 20% de produtos que geram 80% do seu faturamento.</p>
             </div>
             <div className="p-6 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase">Horário de Pico</span>
                <p className="text-[11px] text-slate-500 mt-2">Saiba exatamente quando seu bar "bomba" para reforçar o atendimento.</p>
             </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-red-200 dark:border-red-900/30 shadow-2xl overflow-hidden min-h-[550px] flex flex-col lg:flex-row">
      {/* Sidebar amigável */}
      <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col">
        <div className="mb-10">
          <h3 className="text-xl font-black text-red-600 uppercase tracking-tighter italic leading-none">Central de Ajuda</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Como usar o seu Botequista</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {(Object.keys(panels) as Array<keyof typeof panels>).map(key => (
            <button 
              key={key} 
              onClick={() => setActivePanel(key)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activePanel === key ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={panels[key].icon} /></svg>
              {panels[key].title}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo simples */}
      <div className="flex-1 p-10 lg:p-16 overflow-y-auto max-h-[700px] no-scrollbar bg-white dark:bg-slate-900">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">{panels[activePanel].title}</h2>
          <div className="h-1 bg-red-600 w-20 mt-4"></div>
        </div>

        {panels[activePanel].content}
      </div>
    </div>
  );
};

export default SystemDocs;