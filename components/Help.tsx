
import React from 'react';

const Help: React.FC = () => {
  const FakeButton = ({ children, color = "red" }: { children?: React.ReactNode, color?: string }) => (
    <span className={`inline-block px-2 py-1 mx-1 text-[10px] font-black uppercase rounded-lg shadow-sm text-white ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
      {children}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-block bg-red-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg shadow-red-500/20">Manual Operacional do Bar</div>
        <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Guia do Botequista <span className="text-red-600">Pro</span> 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium text-lg">
          Domine a gestão do seu bar. Do lançamento rápido ao controle financeiro avançado.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Vendas & Agilidade */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-red-500/50 transition-all group">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Vendas & Agilidade</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-red-600 font-black">Mesa vs Balcão:</span> Use <FakeButton>Abrir Mesa</FakeButton> para contas longas. Para vendas rápidas, toque direto no produto e cobre na hora.</p>
            <p>• <span className="text-red-600 font-black">Atalhos:</span> Produtos marcados com ⭐ aparecem no topo. Use a busca inteligente para filtrar cardápios gigantes em segundos.</p>
          </div>
        </section>

        {/* Card 2: Engenharia de Cardápio (Atualizado) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-blue-500/50 transition-all group">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Engenharia de Cardápio</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-blue-600 font-black">Vínculos Automáticos:</span> Na aba <span className="italic">Vínculos</span>, ligue categorias a menus de opções. Ex: Toda "Dose" pede "Gelo/Limão" automaticamente.</p>
            <p>• <span className="text-blue-600 font-black">Venda por Peso:</span> Configure itens como <FakeButton color="blue">KG</FakeButton> para abrir a balança digital no momento da venda (Buffet/Petiscos).</p>
          </div>
        </section>

        {/* Card 3: Hierarquia & Equipe (NOVO) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-violet-100 dark:border-violet-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-violet-500/50 transition-all group">
          <div className="flex items-center gap-4 text-violet-600">
            <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Hierarquia & Equipe</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-violet-600 font-black">Operador:</span> Acesso restrito a vendas. Não vê relatórios financeiros totais nem fecha caixa.</p>
            <p>• <span className="text-violet-600 font-black">Gerente:</span> Pode anular vendas, fechar turnos e cadastrar produtos. Não apaga o banco de dados.</p>
            <p>• <span className="text-violet-600 font-black">Admin:</span> Poder total. Acesso à gestão de franquias e backups.</p>
          </div>
        </section>

        {/* Card 4: Gestão de Fluxo (Blind Close) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900 shadow-sm space-y-6 flex flex-col h-full hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Fechamento Cego</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-emerald-600 font-black">O Conceito:</span> O sistema <span className="underline">não mostra</span> quanto dinheiro deveria ter na gaveta. O operador é obrigado a contar.</p>
            <p>• <span className="text-emerald-600 font-black">Resultado:</span> A sobra ou falta só aparece após a confirmação, prevenindo furtos ou "ajustes" manuais no dinheiro.</p>
          </div>
        </section>

        {/* Card 5: Tesouraria & Cofre (Renomeado) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-900 shadow-sm space-y-6 flex flex-col h-full hover:border-indigo-500/50 transition-all group">
          <div className="flex items-center gap-4 text-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Tesouraria & Cofre</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-indigo-600 font-black">Sangrias (Retirada):</span> Mova excesso de dinheiro da gaveta para o cofre seguro durante o movimento. Registre tudo!</p>
            <p>• <span className="text-indigo-600 font-black">Suprimentos (Entrada):</span> Acabou o troco? Registre a entrada de valores vindos do cofre para a gaveta.</p>
          </div>
        </section>

        {/* Card 6: Controle de Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-100 dark:border-orange-900 shadow-sm space-y-6 flex flex-col h-full hover:border-orange-500/50 transition-all group">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Controle de Fiados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-orange-600 font-black">Carteira Digital:</span> Ao fechar como <FakeButton color="slate">Pendura</FakeButton>, o sistema cria uma conta corrente para o cliente.</p>
            <p>• <span className="text-orange-600 font-black">Quitação Inteligente:</span> Use o atalho no relatório de Penduras para receber dívidas. O valor entra automaticamente no caixa do dia atual.</p>
          </div>
        </section>

        {/* Card 7: Tecnologia Offline-First (NOVO) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 flex flex-col h-full hover:border-slate-400 transition-all group">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Modo Offline & Sync</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-slate-900 dark:text-white font-black">Sem Internet? Sem Problema:</span> Continue vendendo normalmente. O sistema guarda tudo no dispositivo.</p>
            <p>• <span className="text-slate-900 dark:text-white font-black">Auto-Sync:</span> Assim que a conexão voltar, os dados sobem para a nuvem automaticamente (indicador verde no topo).</p>
          </div>
        </section>

        {/* Card 8: Gestão de Redes (NOVO) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-cyan-100 dark:border-cyan-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-cyan-500/50 transition-all group">
          <div className="flex items-center gap-4 text-cyan-600">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Rede de Franquias</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-cyan-600 font-black">Multi-Unidade:</span> Tem mais de um bar? Alterne entre unidades com um clique no topo da tela sem precisar de logins diferentes.</p>
            <p>• <span className="text-cyan-600 font-black">Isolamento:</span> Cada unidade tem seu próprio cardápio, estoque e caixa. O Admin vê tudo, o Operador só vê sua loja.</p>
          </div>
        </section>

        {/* Card 9: Auditoria & Segurança */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-pink-100 dark:border-pink-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-pink-500/50 transition-all group">
          <div className="flex items-center gap-4 text-pink-600">
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Auditoria & Segurança</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-pink-600 font-black">Rastro Digital:</span> Vendas "excluídas" nunca somem de verdade. Elas ficam arquivadas como <span className="italic">Anuladas</span> com o nome de quem apagou.</p>
            <p>• <span className="text-pink-600 font-black">Proteção de Caixa:</span> Edições de produto e conferência de valores são bloqueadas para usuários básicos.</p>
          </div>
        </section>
        
        {/* Card 10: Relatórios Inteligentes */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-amber-500/50 transition-all group">
          <div className="flex items-center gap-4 text-amber-600">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Relatórios Inteligentes</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-amber-600 font-black">Curva ABC:</span> Descubra quais produtos pagam as contas e quais só ocupam espaço na geladeira.</p>
            <p>• <span className="text-amber-600 font-black">Pico de Horário:</span> O gráfico operacional mostra a hora exata que seu bar lota, ajudando a escalar a equipe certa.</p>
          </div>
        </section>

        {/* Card 11: Suporte & Feedback */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-teal-100 dark:border-teal-900/30 shadow-sm space-y-6 flex flex-col h-full hover:border-teal-500/50 transition-all group">
          <div className="flex items-center gap-4 text-teal-600">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Suporte & Feedback</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed flex-1">
            <p>• <span className="text-teal-600 font-black">Contato Direto:</span> Encontrou um bug? Tem uma ideia genial? Use o botão de balão no topo da tela.</p>
            <p>• <span className="text-teal-600 font-black">Transparência:</span> Seus feedbacks viram tarefas reais no desenvolvimento do sistema.</p>
          </div>
        </section>
      </div>

      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
            <span className="text-red-500 text-4xl">★</span> Mandamentos do Botequista
          </h3>
          <div className="bg-red-600 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20">Protocolo Operacional v4.0</div>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm font-bold uppercase tracking-wide opacity-90">
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Feche o turno diariamente. Acúmulo de dias deixa o sistema lento.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Padronize categorias (ex: "CERVEJAS", não "Cerveja").</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Use a função "Vínculos" para acelerar o atendimento de bebidas.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Nunca misture dinheiro pessoal com a gaveta do bar.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Sangrias: Retire excesso de dinheiro para o cofre durante a noite.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Verifique se o ponto verde de "Sincronizado" está ativo ao fim do dia.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Não compartilhe senhas de Admin. Crie usuários para cada garçom.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Confira os relatórios de "Penduras" toda segunda-feira.</li>
          <li className="flex items-start gap-3"><span className="text-red-500 text-lg">✔</span> Salve os comprovantes de fechamento (PNG) no celular do gerente.</li>
        </ul>
      </div>
    </div>
  );
};

export default Help;
