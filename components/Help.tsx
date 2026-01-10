
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
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Mesa</FakeButton>.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento:</span> Toque nos itens. Para peso, informe as gramas (ex: 450 para 450g).</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Fechar Conta</FakeButton> e escolha a forma.</p>
          </div>
        </section>

        {/* Card: Favoritos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-amber-200 dark:border-amber-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-amber-600">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Agilidade (Favoritos)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-amber-600 font-black">Como Favoritar:</span> Em <span className="font-black">Produtos</span>, toque na estrela de cada item.</p>
            <p>• <span className="text-amber-600 font-black">Atalho PDV:</span> Os favoritos ganham uma seção exclusiva no topo do PDV para vendas rápidas de itens com muita saída.</p>
          </div>
        </section>

        {/* Card: Divisão de Conta */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Divisão de Valores</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Múltiplos Pagamentos:</span> Você pode adicionar vários pagamentos em uma só mesa (ex: R$ 10 no PIX e o resto no Dinheiro).</p>
            <p>• <span className="text-emerald-600 font-black">Segurança:</span> Se desistir da divisão, basta clicar em <span className="font-black italic">Voltar</span>. O saldo total da mesa será restaurado.</p>
          </div>
        </section>

        {/* Card: Padrão Brasileiro */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
               <span className="font-black text-2xl">,00</span>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Padrão de Vírgula</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Entrada BR:</span> Digite os centavos usando a vírgula (ex: 15,50). O sistema já está preparado para o teclado brasileiro.</p>
            <p>• <span className="text-blue-600 font-black">Cuidado:</span> Não é necessário digitar o "R$". Apenas o número e a vírgula se houver centavos.</p>
          </div>
        </section>

        {/* Card: Quitação de Fiado */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Quitar Fiado (Pendura)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="font-black">Abatimento:</span> Vá em <span className="font-black">Relatórios → Penduras</span> e clique em <FakeButton>Quitar</FakeButton>.</p>
            <p>• <span className="font-black">Caixa:</span> O dinheiro da quitação entra automaticamente no caixa do turno atual como uma entrada positiva.</p>
          </div>
        </section>

        {/* Card: Turnos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-red-200 dark:border-red-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Abertura e Fechamento</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-red-600 font-black">Conferência:</span> Ao fechar o turno, o sistema mostra quanto deveria ter na gaveta. Compare com o dinheiro físico.</p>
            <p>• <span className="text-red-600 font-black">Importante:</span> Não finalize o turno se houver mesas abertas que você deseja cobrar no próximo período.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Dicas de Ouro
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Operação Ágil</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Trocar de mesa limpa qualquer tentativa de divisão não finalizada.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use o Gemini (IA) para ver quais dias da semana você fatura mais.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Marque com estrela os itens que você mais vende para ganhar tempo no balcão.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
