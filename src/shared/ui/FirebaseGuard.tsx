import React from 'react';

export const FirebaseGuard: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 p-8 rounded-[32px] text-center max-w-lg shadow-2xl animate-in zoom-in-95">
        <h2 className="text-2xl font-black text-red-600 dark:text-red-500 uppercase mb-4 tracking-tighter italic">Erro de Ambiente na Vercel</h2>
        <p className="text-slate-800 dark:text-slate-200 text-sm mb-6 font-medium">
          A variável de ambiente <strong>VITE_FIREBASE_API_KEY</strong> não foi encontrada durante o "Build". Isso significa que as variáveis que você configurou não foram injetadas.
        </p>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-left border border-slate-200 dark:border-slate-800">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Como Resolver Agora:</h3>
          <ul className="text-slate-600 dark:text-slate-400 text-xs list-decimal pl-4 space-y-3 font-medium">
            <li>Verifique se você configurou os valores sem usar <b>aspas</b> no painel da Vercel.</li>
            <li>Certifique-se de que elas estão habilitadas para <b>Production</b>.</li>
            <li>O MAIS IMPORTANTE: Ao clicar em "Redeploy", desmarque obrigatoriamente a opção <b>"Use existing Build Cache"</b>. Se você não desmarcar isso, a Vercel vai reaproveitar a versão quebrada antiga!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
