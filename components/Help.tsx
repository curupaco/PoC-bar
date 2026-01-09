
import React from 'react';

const Help: React.FC = () => {
  // Fix: children prop made optional to prevent type errors when used as JSX wrapper
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
        {/* Vendas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Nova Mesa</FakeButton>. Pode ser o número ou o nome do cliente.</p>
            <p>2. <span className="text-red-600 font-black">Peso ou Unidade:</span> Produtos de peso pedem o valor em <span className="underline italic font-bold">gramas</span> (ex: 450 para 450g). Itens de unidade basta clicar!</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Fechar Conta</FakeButton> e escolha a forma de pagamento.</p>
          </div>
        </section>

        {/* Penduras */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Penduras (O Fiado)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Marcar:</span> Na hora de fechar, selecione <span className="font-bold underline">Pendura</span>. Identificar o cliente é obrigatório para não esquecer depois!</p>
            <p>• <span className="text-orange-600 font-black">Receber:</span> Vá em <span className="font-black italic">Relatórios > Penduras</span>. Clique em <FakeButton>Quitar</FakeButton> e o valor volta pro PDV para você fechar em dinheiro ou cartão.</p>
          </div>
        </section>

        {/* Tesouraria */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Caixas e Tesouraria</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Os 3 Caixas:</span> O sistema gerencia o <span className="font-bold">Primário</span> (Cofre), a <span className="font-bold">Gaveta</span> (Troco do Dia) e o <span className="font-bold">Secundário</span> (Reserva).</p>
            <p>• <span className="text-blue-600 font-black">Mover Dinheiro:</span> Use a tela de <span className="font-black italic uppercase">Tesouraria</span> para passar valor do cofre pra gaveta se faltar troco. Tudo fica registrado.</p>
          </div>
        </section>

        {/* Fechamento */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turnos e Fechamento</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Abrir Turno:</span> Informe o <span className="font-bold underline italic">Troco Inicial</span> da gaveta. Sem isso o PDV fica bloqueado.</p>
            <p>• <span className="text-emerald-600 font-black">Bater Caixa:</span> Ao fechar, o sistema mostra o <span className="font-bold">Esperado na Gaveta</span>. Se não bater, alguém esqueceu de lançar venda ou deu troco errado!</p>
          </div>
        </section>

        {/* Segurança */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Backup e Cloud</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="font-black">Nuvem:</span> A bolinha verde indica que seus dados estão salvos no Firebase. Se estiver vermelha, continue vendendo; o sistema salva quando a rede voltar.</p>
            <p>• <span className="font-black">Snapshot:</span> Em <span className="font-black italic uppercase">Ajustes</span>, use o <FakeButton color="blue">Snapshot</FakeButton>. Ele cria uma cópia local de tudo pra você não perder nada por erro humano.</p>
          </div>
        </section>

        {/* Equipe */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-purple-200 dark:border-purple-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-purple-600">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Gestão de Garçons</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-purple-600 font-black">Acessos:</span> No menu <span className="font-bold">USUÁRIOS</span>, você cria logins para cada um. O Admin vê tudo, o Garçom pode ser limitado só ao PDV.</p>
            <p>• <span className="text-purple-600 font-black">Segurança:</span> Nunca passe sua senha de Admin. Só nela você pode apagar vendas e ver relatórios financeiros.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Mandamentos do Dono
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold uppercase tracking-wide opacity-90">
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span> Sempre feche o turno ao sair do bar para gerar o cupom de conferência.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span> O Botequista usa <span className="underline">CAIXA ALTA</span> em tudo pra ser fácil de ler no balcão escuro.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span> Em caso de erro na internet, os dados ficam salvos no seu navegador até você voltar online.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span> A exclusão de vendas só é permitida por quem tem permissão <span className="text-red-500 italic">delete_sale</span>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
