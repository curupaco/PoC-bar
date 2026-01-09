
import React from 'react';

const Help: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header Amigável */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Guia do Botequista 🍺</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Dúvidas sobre o sistema? Aqui a gente explica tudo no "papo de balcão". Simples, direto e sem frescura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vendas e PDV */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Vendendo Igual Água</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>1. <span className="text-red-600 font-black">Abra uma Mesa:</span> No PDV, clique em <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Abrir Nova Mesa</span>. Pode ser o número da mesa ou o nome do freguês.</p>
            <p>2. <span className="text-red-600 font-black">Lançamento por Peso:</span> Se o item for por quilo (tipo batata frita ou buffet), digite o peso em <span className="font-black underline">gramas</span> (ex: 350 para 350g). O preço sai calculado na hora!</p>
            <p>3. <span className="text-red-600 font-black">Fechando a Conta:</span> Clique na mesa, confira o consumo e aperte <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Fechar Conta</span>. Escolha como o cliente pagou e o sistema libera a mesa.</p>
          </div>
        </section>

        {/* Penduras e Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Penduras (O Fiado)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Como registrar:</span> Na hora de pagar, selecione <span className="font-black text-orange-600 underline">Pendura</span>. O nome do cliente é obrigatório pra você não se perder depois.</p>
            <p>• <span className="text-orange-600 font-black">Como cobrar:</span> Vá em <span className="font-black">RELATÓRIOS > PENDURAS</span>. Lá tem a lista de quem deve. Clique em <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Quitar</span> e o valor vai pro PDV pra você receber em dinheiro ou cartão.</p>
          </div>
        </section>

        {/* Tesouraria */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">O Cofre (Tesouraria)</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Os Três Caixas:</span> O sistema divide seu dinheiro em <span className="font-bold">Primário</span> (Cofre), <span className="font-bold">Troco/Float</span> (Gaveta) e <span className="font-bold">Secundário</span> (Reserva).</p>
            <p>• <span className="text-blue-600 font-black">Transferências:</span> Se faltar troco na gaveta, use a tela de <span className="font-black">CAIXA / TESOURARIA</span> para mover o valor do Cofre para a Gaveta. Tudo fica registrado no turno!</p>
          </div>
        </section>

        {/* Equipe */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-purple-200 dark:border-purple-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-purple-600">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Equipe de Elite</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-purple-600 font-black">Crie Acessos:</span> Em <span className="font-black">USUÁRIOS</span>, você pode criar logins para seus garçons. O legal é que você escolhe exatamente o que cada um pode fazer.</p>
            <p>• <span className="text-purple-600 font-black">Dica de Segurança:</span> O garçom pode ter acesso apenas ao <span className="font-bold italic">PDV</span> e <span className="font-bold italic">HISTÓRICO</span>, deixando Relatórios e Ajustes só para o dono.</p>
          </div>
        </section>

        {/* Turnos e Gaveta */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turnos e Fechamento</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Começando o dia:</span> Abra o turno e informe quanto tem de <span className="font-bold">Troco na Gaveta</span>. Sem turno aberto, o PDV não deixa vender.</p>
            <p>• <span className="text-emerald-600 font-black">Batendo o Caixa:</span> Ao fechar, o sistema mostra o <span className="font-black">ESPERADO GAVETA</span>. Se o dinheiro na mão não bater com esse valor, alguém deu troco errado ou esqueceu de lançar algo!</p>
          </div>
        </section>

        {/* Estilo e Backup */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Personalização e Fogo</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="font-black">Modo Dark:</span> Clique no ícone de <span className="bg-slate-800 text-white p-1 rounded">🌞/🌙</span> no topo para alternar. O modo escuro economiza bateria e cansa menos a vista à noite.</p>
            <p>• <span className="font-black">Backup Local:</span> Em <span className="font-black italic text-red-500">Ajustes</span>, use o <span className="font-bold">Snapshot</span>. Ele salva uma cópia de tudo no seu navegador. É a sua segurança contra erros de internet.</p>
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
              Para excluir uma mesa com consumo, você precisa ser <span className="text-red-500">ADMIN</span>.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Os nomes de produtos e categorias são exibidos em <span className="underline">CAIXA ALTA</span> para facilitar a leitura rápida no balcão.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Sempre feche o turno antes de sair do bar para gerar o relatório final corretamente.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              A bolinha verde na barra lateral é sua melhor amiga: indica que os dados estão salvos na nuvem!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
