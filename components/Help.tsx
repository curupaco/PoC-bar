
import React from 'react';

const Help: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header Amigável */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia do Botequista 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dúvidas sobre o sistema? Aqui a gente explica tudo no "papo de balcão". Simples, direto e focado no seu bar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vendas e PDV */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>1. <span className="text-red-600 font-black">Abra uma Mesa:</span> No PDV, clique em <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">Abrir Nova Mesa</span>. Pode ser o número ou o nome do freguês.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento por Peso:</span> Se o item for por gramatura, digite o peso em <span className="font-black underline italic">gramas</span> (ex: 450 para 450g). O sistema calcula o valor final sozinho.</p>
            <p>3. <span className="text-red-600 font-black">Fechamento:</span> Clique na mesa, aperte <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">Fechar Conta</span> e escolha como o cliente pagou.</p>
          </div>
        </section>

        {/* Penduras e Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Penduras (Fiados)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Como registrar:</span> Na hora do pagamento, selecione <span className="font-black text-orange-600 underline">Pendura</span>. Identificar o cliente é obrigatório para cobrança futura.</p>
            <p>• <span className="text-orange-600 font-black">Como quitar:</span> Vá em <span className="font-black">RELATÓRIOS > PENDURAS</span>. Clique no botão <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">Quitar</span> para enviar a dívida de volta pro PDV e receber o dinheiro.</p>
          </div>
        </section>

        {/* Tesouraria */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Cofre e Gaveta</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Divisão de Caixas:</span> O sistema gerencia o <span className="font-bold">Primário</span> (Cofre), a <span className="font-bold">Gaveta</span> (Troco do Dia) e o <span className="font-bold">Secundário</span> (Reserva).</p>
            <p>• <span className="text-blue-600 font-black">Movimentação:</span> Use a tela de <span className="font-black italic uppercase">Tesouraria</span> para transferir valores entre caixas. Tudo fica registrado no histórico do turno.</p>
          </div>
        </section>

        {/* Equipe */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-purple-200 dark:border-purple-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-purple-600">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Gestão de Equipe</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-purple-600 font-black">Usuários:</span> Em <span className="font-black italic uppercase">Usuários</span>, você cria logins individuais para cada colaborador.</p>
            <p>• <span className="text-purple-600 font-black">Permissões:</span> Você decide quem pode ver relatórios, quem pode excluir vendas e quem só pode usar o PDV. O Admin tem acesso a tudo por padrão.</p>
          </div>
        </section>

        {/* Turnos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Controle de Turnos</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Abertura:</span> Sempre comece o dia abrindo o turno e informando o <span className="font-bold underline italic">Troco Inicial</span>. Sem isso, o PDV fica bloqueado por segurança.</p>
            <p>• <span className="text-emerald-600 font-black">Fechamento:</span> Ao encerrar, o sistema calcula o <span className="font-bold">Esperado na Gaveta</span> somando o troco inicial às vendas em dinheiro.</p>
          </div>
        </section>

        {/* Interface e Estilo */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Estilo do Beco</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="font-black">Temas:</span> Clique no ícone de <span className="bg-slate-800 text-white p-1 rounded font-bold">🌞/🌙</span> no topo para alternar entre os modos claro e escuro.</p>
            <p>• <span className="font-black">Legibilidade:</span> Tudo no sistema é exibido em <span className="font-black underline italic uppercase tracking-widest">Caixa Alta</span>. Isso facilita a leitura rápida em ambientes escuros e telas pequenas.</p>
          </div>
        </section>
      </div>

      {/* Regras de Ouro */}
      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Regras de Ouro do Bar
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold uppercase tracking-wide opacity-90">
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Para excluir uma mesa com consumo, você precisa ser <span className="text-red-500">ADMIN</span> ou ter permissão de exclusão.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Sempre realize o fechamento de turno para manter a conferência da gaveta em dia.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              A bolinha verde na barra lateral indica que seus dados estão salvos na nuvem em tempo real.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              O backup via <span className="text-red-500 underline">SNAPSHOT</span> (em Ajustes) é a sua segurança local em caso de falha de internet.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
