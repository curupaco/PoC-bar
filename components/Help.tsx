
import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Manual do Proprietário</div>
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Central de Treinamento 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Tudo o que você precisa saber para operar o Botequista como um profissional e aumentar o lucro do seu bar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Vendas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Mesa</FakeButton>.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento:</span> Toque nos itens. Para peso, informe as gramas (ex: 450 para 450g).</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Receber Pagamento</FakeButton> e escolha a forma.</p>
          </div>
        </section>

        {/* Card: Controle Preciso */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Ajustes Rápidos</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Unidades:</span> Agora os botões <span className="font-black">[-]</span> e <span className="font-black">[+]</span> ficam à esquerda da quantidade para agilizar o ajuste.</p>
            <p>• <span className="text-blue-600 font-black">Pesáveis (✎):</span> O ícone de lápis fica à esquerda do peso. Clique nele para abrir o teclado e corrigir a gramagem.</p>
            <p>• <span className="text-blue-600 font-black">Remover:</span> O ícone de lixeira (remover item) fica isolado à direita para evitar erros.</p>
          </div>
        </section>

        {/* Card: Regras de Negócio */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Crédito e Fiados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Limite de Fiado:</span> Configure em "Ajustes" o limite máximo de penduras que o bar aceita.</p>
            <p>• <span className="text-orange-600 font-black">Aviso Visual:</span> Se o total de penduras passar do limite, o menu "Relatórios" mostrará um ⚠️ piscante como alerta de risco.</p>
          </div>
        </section>

        {/* Outros cards permanecem... */}
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Dicas de Sobrevivência
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Protocolo de Operação</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca compartilhe sua Senha Master com funcionários.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Faça um fechamento de turno rigoroso para validar a gaveta de dinheiro.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Mantenha a API Key configurada para insights inteligentes da IA.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
