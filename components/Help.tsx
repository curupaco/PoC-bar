
import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-red-500/20">Manual Operacional do Bar</div>
        <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia do Botequista <span className="text-red-600">Pro</span> 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium text-lg">
          Domine a gestão do seu bar. Do lançamento rápido ao fechamento cego de caixa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Vendas & Comandas */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Vendas & Comandas</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black">Mesa vs Balcão:</span> Use o botão <FakeButton>Abrir Mesa</FakeButton> para gerenciar contas longas ou toque direto no produto para vendas rápidas.</p>
            <p>• <span className="text-red-600 font-black">Divisão de Conta:</span> O sistema permite pagamentos parciais. Basta informar o valor no painel de pagamento e clicar em <FakeButton color="blue">Adicionar</FakeButton>.</p>
          </div>
        </section>

        {/* Card 2: Cardápio Digital */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-blue-500/50 transition-all">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Cardápio Digital</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black">Favoritos:</span> Marque produtos com ⭐ para que eles apareçam no topo do PDV, agilizando 80% dos seus lançamentos.</p>
            <p>• <span className="text-blue-600 font-black">Produtos p/ Peso:</span> No cadastro, selecione <FakeButton color="blue">Peso (KG)</FakeButton>. O sistema abrirá um teclado numérico para gramas ao vender.</p>
          </div>
        </section>

        {/* Card 3: Gestão de Fluxo */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Gestão de Fluxo</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">Fechamento Cego:</span> Ao encerrar o turno, o operador deve contar o dinheiro real. O sistema aponta a <span className="text-red-600 font-black">Diferença</span> automaticamente.</p>
            <p>• <span className="text-emerald-600 font-black">Segurança:</span> Apenas usuários com permissão podem reabrir turnos ou ver o saldo esperado antes da contagem.</p>
          </div>
        </section>

        {/* Card 4: Backup & Nuvem */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16a3 3 0 01-3 3H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v1a3 3 0 013 3v1m-3 0a3 3 0 01-3 3H8a3 3 0 01-3-3V8a3 3 0 013-3h5M8 12h1" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Backup & Nuvem</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black">Auto-Sync:</span> Os dados são salvos no Firebase em tempo real. Se o ícone no topo estiver verde, seu bar está seguro.</p>
            <p>• <span className="text-violet-600 font-black">Gestão Nuvem:</span> Use a aba "Ajustes" para gerar cópias de segurança externas em formato JSON para maior controle.</p>
          </div>
        </section>

        {/* Card 5: Controle de Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Controle de Fiados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black">O Pendura:</span> Ao fechar uma mesa como <span className="font-bold">Pendura</span>, o nome do cliente é gravado na carteira de devedores.</p>
            <p>• <span className="text-orange-600 font-black">A Quitação:</span> Vá em <span className="italic">Relatórios > Penduras</span> para receber pagamentos de dívidas antigas e limpar o saldo do cliente.</p>
          </div>
        </section>

        {/* Card 6: Movimentações */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900 shadow-sm space-y-6 flex flex-col h-full hover:border-indigo-500/50 transition-all">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Movimentações</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-indigo-600 font-black">Sangrias:</span> Use para retirar excesso de dinheiro da gaveta e mover para o cofre durante o expediente.</p>
            <p>• <span className="text-indigo-600 font-black">Suprimentos:</span> Adicione dinheiro à gaveta caso o troco inicial acabe. Tudo fica registrado na <span className="font-bold">Tesouraria</span>.</p>
          </div>
        </section>

        {/* Card 7: Auditoria (Anulação) - NOVO */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-pink-100 dark:border-pink-900 shadow-sm space-y-6 flex flex-col h-full hover:border-pink-500/50 transition-all">
          <div className="flex items-center gap-4 text-pink-600">
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Auditoria & Anulação</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-pink-600 font-black">Exclusão Lógica:</span> Vendas anuladas não somem do banco. Elas ficam marcadas como "Excluídas" para conferência do gestor no Histórico.</p>
            <p>• <span className="text-pink-600 font-black">Responsabilidade:</span> O sistema grava quem anulou a venda e o horário exato, garantindo total rastreabilidade financeira.</p>
          </div>
        </section>

        {/* Card 8: Inteligência & Metas - NOVO */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-cyan-100 dark:border-cyan-900 shadow-sm space-y-6 flex flex-col h-full hover:border-cyan-500/50 transition-all">
          <div className="flex items-center gap-4 text-cyan-600">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Inteligência & Metas</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-cyan-600 font-black">Curva ABC:</span> Descubra quais produtos geram mais faturamento versus quais saem em maior volume (Relatórios > Produtos).</p>
            <p>• <span className="text-cyan-600 font-black">Pico de Horário:</span> O mapa operacional mostra qual hora do dia o seu bar exige mais equipe para não perder vendas por lentidão.</p>
          </div>
        </section>

        {/* Card 9: Adicionais (Upsell) - NOVO */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900 shadow-sm space-y-6 flex flex-col h-full hover:border-amber-500/50 transition-all">
          <div className="flex items-center gap-4 text-amber-600">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Adicionais (Upsell)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-amber-600 font-black">Menus Dinâmicos:</span> Vincule menus de opções (Gelo, Borda, Complementos) a categorias inteiras na aba <span className="italic">Cardápio > Vínculos</span>.</p>
            <p>• <span className="text-amber-600 font-black">Automação:</span> Ao lançar uma bebida da categoria vinculada, o sistema abre automaticamente a sugestão de adicionais para o operador.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Regras de Gestão Eficiente
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20">Protocolo Operacional v3.9</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Feche o turno todos os dias para evitar acúmulo de dados desorganizados.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Registre o nome do cliente em todas as comandas, mesmo no balcão.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use categorias claras (Bebidas, Comidas, Tabaco) para relatórios precisos.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca misture dinheiro pessoal com o troco da gaveta do bar.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Sangrias: Retire valores altos da gaveta durante a noite e registre no sistema.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Verifique se o ponto verde de "Sincronizado" está ativo antes de vender.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Mantenha o cardápio com preços atualizados para não perder margem.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Confira os relatórios de "Penduras" semanalmente para cobrar os devedores.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use o botão "Salvar Cupom" nos relatórios para ter provas do fechamento.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
