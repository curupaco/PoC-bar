
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
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Central de Treinamento 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dúvida na operação? Aqui você encontra o guia completo para dominar o Botequista.
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
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Nova Mesa</FakeButton>.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento:</span> Toque nos itens. Para peso, informe as gramas (ex: 450 para 450g).</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Fechar Conta</FakeButton> e escolha a forma.</p>
          </div>
        </section>

        {/* Card 2: Segurança */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Dados na Nuvem</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Sincronização:</span> Tudo é salvo automaticamente em seu Banco de Dados remoto.</p>
            <p>• <span className="text-orange-600 font-black">Penduras:</span> Vá em <span className="font-black italic">Relatórios → Penduras</span> para gerenciar fiados.</p>
            <p>• <span className="text-orange-600 font-black">Offline:</span> O sistema funciona sem internet e sincroniza assim que o sinal voltar.</p>
          </div>
        </section>

        {/* Card 3: Produtos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M4 3h5.881L21.119 14.238a2 2 0 010 2.828l-4.053 4.053a2 2 0 01-2.828 0L3 9.882V4a1 1 0 011-1z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Cardápio & Estoque</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Categorias:</span> Use CAIXA ALTA para nomes. Melhora a leitura no escuro.</p>
            <p>• <span className="text-blue-600 font-black">Venda por Peso:</span> Ideal para porções ou refeições self-service.</p>
            <p>• <span className="text-blue-600 font-black">Organização:</span> Mantenha categorias limpas como BEBIDAS, DOSES ou COZINHA.</p>
          </div>
        </section>

        {/* Card 4: Equipe */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Equipe & Colaboração</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Usuários:</span> Cada atendente deve ter seu login para rastreabilidade de vendas.</p>
            <p>• <span className="text-emerald-600 font-black">Permissões:</span> Limite quem pode excluir vendas ou alterar preços.</p>
            <p>• <span className="text-emerald-600 font-black">Turnos:</span> Sempre encerre seu turno ao sair. Isso congela seu relatório do dia.</p>
          </div>
        </section>

        {/* Card 5: Tesouraria */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-200 dark:border-indigo-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Caixa & Tesouraria</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-indigo-600 font-black">Caixas:</span> Temos 3 níveis (Primário/Cofre, Gaveta e Secundário).</p>
            <p>• <span className="text-indigo-600 font-black">Transferência:</span> Movimente dinheiro entre caixas na aba <span className="font-black italic">Caixa</span>.</p>
            <p>• <span className="text-indigo-600 font-black">Fundo:</span> Nunca esqueça de informar o fundo de troco na abertura do turno.</p>
          </div>
        </section>

        {/* Card 6: Dashboard */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Análise de Dados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="font-black">Dashboard:</span> Visão rápida de ticket médio e produtos mais vendidos.</p>
            <p>• <span className="font-black">IA Insight:</span> Use o botão "Gerar Insights" para dicas de como vender mais.</p>
            <p>• <span className="font-black">Relatórios:</span> Gere cupons de fechamento e salve em PNG para sua contabilidade.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Regras de Ouro do Botequista
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Atenção Máxima</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Feche o turno ao sair do bar para conferir a gaveta.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Tudo em CAIXA ALTA facilita a leitura no escuro.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca compartilhe sua senha mestra.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Verifique o sinal da internet no topo da tela.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Quitar pendura gera uma entrada real no caixa.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Snapshot local é sua última linha de defesa.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
