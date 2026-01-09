
import React from 'react';

const Help: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      {/* Header Amigável */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Precisa de uma mãozinha?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Relaxa! O Botequista foi feito pra ser simples. Aqui você entende como cada engrenagem do seu bar funciona no sistema.
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
            <p>1. <span className="text-red-600 font-black">Abra uma Mesa:</span> Clique em <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold">ABRIR NOVA MESA</span> e dê um nome (ex: "Mesa 04" ou "João").</p>
            <p>2. <span className="text-red-600 font-black">Lançamento por Peso:</span> Se o item for por quilo, vai subir um teclado numérico. Digite o peso em <span className="font-black underline">gramas</span> (ex: 500 para meio quilo). O sistema calcula o preço na hora!</p>
            <p>3. <span className="text-red-600 font-black">Fechando a Conta:</span> Clique na mesa, veja o resumo e aperte <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold">FECHAR CONTA</span>. Escolha como o cliente pagou e pronto.</p>
          </div>
        </section>

        {/* Penduras e Fiados */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-orange-600">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">O Famoso "Marca Aí"</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-orange-600 font-black">Registrar Pendura:</span> Na hora de pagar, escolha o método <span className="font-black text-orange-600 underline">Pendura</span>. É <span className="font-black italic">obrigatório</span> colocar o nome do cliente!</p>
            <p>• <span className="text-orange-600 font-black">Como cobrar depois?</span> Vá em <span className="font-black">Relatórios > PENDURAS</span>. Lá você vê quem deve e quanto. Clique em <span className="bg-red-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold">QUITAR</span> para enviar o valor de volta pro PDV e receber.</p>
          </div>
        </section>

        {/* Turnos e Gaveta */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-emerald-200 dark:border-emerald-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Turnos e Dinheiro Vivo</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-emerald-600 font-black">Abertura:</span> Todo dia, comece abrindo o turno. O <span className="font-black">Troco da Gaveta</span> é o valor que você já tem em notas e moedas para dar troco.</p>
            <p>• <span className="text-emerald-600 font-black">Fechamento:</span> Ao fechar o turno, o sistema soma o troco inicial + as vendas em dinheiro. O valor em <span className="font-black">ESPERADO GAVETA</span> deve bater com o que você tem na mão!</p>
          </div>
        </section>

        {/* Backup e Nuvem */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-6">
          <div className="flex items-center gap-4 text-blue-600">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Segurança dos Dados</h3>
          </div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
            <p>• <span className="text-blue-600 font-black">Sincronização:</span> A bolinha verde no menu lateral indica que seus dados estão salvos no Firebase. Se estiver vermelha, você está offline mas <span className="italic">continua podendo vender</span>! O sistema salva tudo quando a internet voltar.</p>
            <p>• <span className="text-blue-600 font-black">Snapshot:</span> Em <span className="font-black">Ajustes</span>, você pode criar um "Ponto de Restauração". Use isso antes de fazer grandes limpezas ou trocas de dispositivo.</p>
          </div>
        </section>
      </div>

      {/* Regras de Ouro */}
      <div className="bg-slate-900 text-white p-10 rounded-[50px] shadow-2xl space-y-8 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
            <span className="text-red-500 text-4xl">★</span> Regras de Ouro do Botequista
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-bold uppercase tracking-wide opacity-90">
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Nomes de categoria são limpos automaticamente (nada de CACHETA, apenas Cacheta).
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Para excluir uma mesa, segure o ícone de lixeira por 1 segundo (evita erros).
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              Relatórios de fechamento podem ser salvos como foto pra mandar no Zap.
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-500">✔</span>
              A Inteligência Artificial (Gemini) só dá dicas se você tiver vendas registradas!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
