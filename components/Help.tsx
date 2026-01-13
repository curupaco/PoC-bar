
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
        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia de Operação 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dicas práticas para operar o Botequista com agilidade e garantir a saúde financeira do seu bar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Vendas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendas no Balcão</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>1. <span className="text-red-600 font-black">Abrir Mesa:</span> No PDV, clique em <FakeButton>Abrir Mesa</FakeButton>.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento:</span> Toque nos itens. Para peso, informe as gramas (ex: 450 para 450g).</p>
            <p>3. <span className="text-red-600 font-black">Pagamento:</span> Clique na mesa, aperte <FakeButton>Receber Pagamento</FakeButton> e escolha a forma.</p>
          </div>
        </section>

        {/* Card 2: Ajustes Rápidos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Ajustes Rápidos</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black">Unidades:</span> Use os botões <span className="font-black">[-]</span> e <span className="font-black">[+]</span> à esquerda da quantidade para agilizar o atendimento.</p>
            <p>• <span className="text-blue-600 font-black">Pesáveis (✎):</span> O ícone de lápis permite corrigir a gramagem de itens já lançados sem precisar excluir.</p>
            <p>• <span className="text-blue-600 font-black">Remover:</span> A lixeira à direita remove o item da comanda instantaneamente.</p>
          </div>
        </section>

        {/* Card 10: Turno vs. Mesas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-500 dark:border-emerald-900 shadow-lg space-y-6 flex flex-col h-full ring-4 ring-emerald-500/10">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turno vs. Mesas</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">Independência:</span> Turnos são do <span className="font-black">operador</span>. Mesas são do <span className="font-black">cliente</span>.</p>
            <p>• <span className="text-emerald-600 font-black">Troca de Turno:</span> Você pode fechar o caixa mesmo com mesas abertas. O novo operador assumirá o caixa com as mesas intactas.</p>
            <p>• <span className="text-emerald-600 font-black">Flexibilidade:</span> O bar não para durante a troca de equipe.</p>
          </div>
        </section>

        {/* Card 3: Crédito e Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Crédito e Fiados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black">Limite de Alerta:</span> Defina em "Ajustes" o valor máximo de penduras globais tolerado pelo bar.</p>
            <p>• <span className="text-orange-600 font-black">Aviso Visual:</span> Se o total de fiados ultrapassar o limite, um ícone ⚠️ aparecerá ao lado de "Relatórios".</p>
            <p>• <span className="text-orange-600 font-black">Quitação:</span> Receba pagamentos de devedores na aba de Relatórios ou via atalho no PDV.</p>
          </div>
        </section>

        {/* Card 4: Gestão de Turnos */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turnos e Caixa</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">Abertura:</span> Sempre inicie o turno informando o fundo de caixa (troco) disponível na gaveta.</p>
            <p>• <span className="text-emerald-600 font-black">Conferência:</span> Ao fechar, o sistema mostra o saldo esperado. Conte o dinheiro físico e valide se bate com o digital.</p>
            <p>• <span className="text-emerald-600 font-black">Segurança:</span> Turnos fechados impedem vendas acidentais fora do horário de operação.</p>
          </div>
        </section>

        {/* Card 5: Tesouraria */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900/30 shadow-sm space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Tesouraria</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-indigo-600 font-black">Sangrias:</span> Mova valores da gaveta para o "Caixa Secundário" (cofre) para reduzir riscos.</p>
            <p>• <span className="text-indigo-600 font-black">Suprimentos:</span> Adicione troco do cofre para a gaveta usando a ferramenta de Transferência.</p>
            <p>• <span className="text-indigo-600 font-black">Histórico:</span> Toda movimentação de caixa fica registrada para auditoria posterior.</p>
          </div>
        </section>
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
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Faça o fechamento de turno rigorosamente todos os dias.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use dosadores e biqueiras para garantir o padrão das bebidas.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Evite deixar comanda aberta de clientes que você não conhece.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Mantenha o balcão sempre limpo e seco: higiene é o seu cartão de visitas.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Confira a validade dos insumos semanalmente para evitar desperdícios.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Identifique fiados com nome e telefone para facilitar a cobrança.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Não misture dinheiro pessoal com o da gaveta de forma alguma.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Ofereça água entre drinks para melhorar a experiência do cliente.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Respeite a lei do silêncio para manter uma boa relação com a vizinhança.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
