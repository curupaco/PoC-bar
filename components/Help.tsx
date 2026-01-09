
import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Papo de Botequim 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dúvida na operação? Relaxa! Aqui a gente explica como girar o sistema no dia a dia, sem complicação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Nova Mesa</FakeButton>.</p>
            <p>2. <span className="text-red-600 font-black">Peso ou Unidade:</span> Produtos de peso pedem o valor em <span className="underline italic font-bold">gramas</span> (ex: 450 para 450g).</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Fechar Conta</FakeButton> e escolha a forma.</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Segurança dos Dados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Nuvem:</span> O sistema salva tudo automaticamente no seu <span className="font-bold underline">Banco de Dados</span> remoto.</p>
            <p>• <span className="text-orange-600 font-black">Receber Penduras:</span> Vá em <span className="font-black italic">Relatórios → Penduras</span> e clique em <FakeButton>Quitar</FakeButton>.</p>
            <p>• <span className="text-orange-600 font-black">Backup:</span> Você pode gerar um arquivo manual em <span className="font-black italic">Ajustes → Exportar JSON</span> para ter uma cópia física.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 italic">
          <span className="text-red-500 text-4xl">★</span> Regras de Ouro
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500">✔</span> Feche o turno ao sair do bar para conferir a gaveta.</li>
          <li className="flex items-start gap-3"><span className="text-red-500">✔</span> Tudo é exibido em CAIXA ALTA para facilitar a leitura no escuro.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
