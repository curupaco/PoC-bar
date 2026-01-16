
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
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Manual Operacional do Bar</div>
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia do Botequista 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dicas práticas para operar seu sistema com rapidez e garantir que cada centavo seja registrado corretamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, identifique a mesa ou o cliente para começar a conta.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento:</span> Toque no produto para adicionar. Para itens pesáveis, informe o peso em gramas.</p>
            <p>3. <span className="text-red-600 font-black">Recebimento:</span> Escolha a forma de pagamento e valide o valor recebido para evitar furos no caixa.</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Cadastro e Preços</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black">Organização:</span> Use as categorias para separar cervejas de porções, facilitando a busca no PDV.</p>
            <p>• <span className="text-blue-600 font-black">Favoritos:</span> Marque com a estrela os itens mais vendidos (como a cerveja principal) para que fiquem no topo da tela.</p>
            <p>• <span className="text-blue-600 font-black">Preços:</span> Mantenha seu cardápio atualizado para que os relatórios de faturamento sejam precisos.</p>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-500 dark:border-emerald-900 shadow-lg space-y-6 flex flex-col h-full ring-4 ring-emerald-500/10">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turnos e Caixa</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">Abertura:</span> Informe o fundo de troco na gaveta ao iniciar o dia.</p>
            <p>• <span className="text-emerald-600 font-black">Conferência:</span> No fim do expediente, conte o dinheiro físico e compare com o saldo que o sistema indica.</p>
            <p>• <span className="text-emerald-600 font-black">Quebra:</span> O sistema aponta automaticamente se houve diferença (falta ou sobra) de valores na gaveta.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Regras de Gestão Eficiente
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Protocolo de Operação</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Feche o turno todos os dias para evitar acúmulo de dados desorganizados.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Registre o nome do cliente em todas as comandas, mesmo no balcão.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use categorias claras (Bebidas, Comidas, Tabaco) para relatórios precisos.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca misture dinheiro pessoal com o troco da gaveta do bar.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Sangrias: Retire valores altos da gaveta durante a noite e registre no sistema.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Verifique se o ponto verde de "Turno Aberto" está ativo antes de vender.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Mantenha o cardápio com preços atualizados para não perder margem.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Confira os relatórios de "Penduras" semanalmente para cobrar os devedores.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use o botão "Salvar Cupom" nos relatórios para ter provas do fechamento.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
