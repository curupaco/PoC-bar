import React, { useState } from 'react';

interface SystemDocsProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SystemDocs: React.FC<SystemDocsProps> = ({ showToast }) => {
  const [activePanel, setActivePanel] = useState<'WIKI' | 'DB' | 'SYNC' | 'RBAC' | 'FIN' | 'ROADMAP'>('WIKI');

  const panels = {
    WIKI: {
      title: 'Engineering Wiki (v3.9)',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      content: (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h4 className="text-emerald-500 font-black uppercase tracking-tighter italic border-b border-emerald-500/20 pb-2">Manifesto Técnico</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase">
              O Botequista Pro utiliza uma arquitetura de "Single Source of Truth" distribuída. 
              Diferente de sistemas Web comuns, operamos com um motor de **Offline-First**, onde a UI reage instantaneamente ao cache local (LocalStorage) e o sincronismo ocorre em background via Fila Atômica.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h5 className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest">Resiliência de Rede</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Utilizamos o algoritmo de <strong>Exponential Backoff</strong>. Se a internet oscila durante uma venda de R$ 500, o sistema retém o pacote, aguarda a estabilidade do ping e re-insere a transação sem duplicidade de ID.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h5 className="text-[10px] font-black text-pink-500 uppercase mb-3 tracking-widest">Auditoria Imutável</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  O nó <code>/sales</code> nunca sofre um <code>DELETE</code> real. Ativamos a flag <code>deleted: true</code> para preservar o histórico para o dono do bar, rastreando fraudes de anulação de comandas recebidas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    DB: {
      title: 'Data Architecture (JSON)',
      icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-2">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Esquema de Dados NoSQL (Firebase Realtime Database)</p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-[10px] leading-relaxed">
              <span className="text-emerald-500 font-bold">// Nó /products/{"{id}"}</span>
              <pre className="text-blue-400 mt-2">
{`{
  "id": "uuid_v4",
  "name": "STRING (UPPER)",
  "price": "NUMBER (FLOAT)",
  "category": "STRING",
  "sellType": "unit | weight",
  "modifierGroupId": "string_ref"
}`}
              </pre>
            </div>
            <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 font-mono text-[10px] leading-relaxed">
              <span className="text-amber-500 font-bold">// Nó /sales/{"{id}"} (Logs)</span>
              <pre className="text-blue-400 mt-2">
{`{
  "timestamp": "epoch_ms",
  "items": "Array<SaleItem>",
  "paymentMethod": "ENUM",
  "total": "NUMBER",
  "deleted": "BOOLEAN",
  "deletedAt": "epoch_ms",
  "deletedBy": "userId"
}`}
              </pre>
            </div>
          </div>
        </div>
      )
    },
    SYNC: {
      title: 'Sync Engine & Concurrency',
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[40px] border-l-8 border-blue-500">
            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase mb-4 italic tracking-tighter">Lógica de Colisão (SmartMerge)</h4>
            <div className="space-y-4 text-[11px] text-slate-500 font-bold uppercase leading-loose">
              <p>1. <strong>Fila de Eventos:</strong> Cada ação é empilhada na <code>SyncQueue</code> com prioridade por tipo.</p>
              <p>2. <strong>Grace Period (120s):</strong> Se uma mesa é editada localmente, ignoramos pacotes do servidor por 2 minutos para evitar que o garçom perca o que acabou de digitar devido a uma rede lenta.</p>
              <p>3. <strong>Integridade Atômica:</strong> O fechamento de turno bloqueia qualquer mutação financeira no nó correspondente até a conciliação.</p>
            </div>
          </div>
        </div>
      )
    },
    RBAC: {
      title: 'Security Matriz (RBAC)',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-[10px] text-left uppercase font-bold">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400">
                <tr>
                  <th className="p-5">Permissão</th>
                  <th className="p-5">Função Técnica</th>
                  <th className="p-5">Impacto Financeiro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                <tr><td className="p-5 text-red-500">full_reset</td><td className="p-5">Trunca todas as tabelas (Purge)</td><td className="p-5 text-red-600">FALAL</td></tr>
                <tr><td className="p-5 text-amber-500">delete_sale</td><td className="p-5">Flag 'deleted' no faturamento</td><td className="p-5">ALTO</td></tr>
                <tr><td className="p-5 text-blue-500">manage_backup</td><td className="p-5">Interação com GitHub Gists API</td><td className="p-5">MÉDIO</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    FIN: {
      title: 'Financial Logic & Shifts',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      content: (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800">
             <h4 className="text-xs font-black text-white uppercase mb-6 tracking-widest italic">Cálculo de Saldo Esperado (Gaveta)</h4>
             <div className="font-mono text-[10px] text-blue-400 space-y-2">
                <p className="border-b border-white/5 pb-2">SUM(openingCashChange)</p>
                <p className="border-b border-white/5 pb-2">+ SUM(sales.total where method == 'CASH')</p>
                <p className="border-b border-white/5 pb-2">+ SUM(settlements.total where method == 'CASH')</p>
                <p className="border-b border-white/5 pb-2">+ SUM(transfers_in) - SUM(transfers_out)</p>
                <p className="pt-4 text-emerald-500 font-black text-xs">= EXPECTED_CASH_IN_DRAWER</p>
             </div>
          </div>
        </div>
      )
    },
    ROADMAP: {
      title: 'Roadmap v4.0 (Future)',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95">
           {[
             { title: 'Multi-Tenant', desc: 'Isolamento de múltiplas unidades de bares sob o mesmo contrato/banco.', icon: '🏢' },
             { title: 'IA Forecasting', desc: 'Previsão de demanda baseada no clima e feriados via Gemini API.', icon: '🤖' },
             { title: 'Totem Self', desc: 'Interface de autoatendimento para tablets fixos nas mesas.', icon: '📱' },
             { title: 'Open Banking', desc: 'Conciliação automática de extratos bancários via API.', icon: '🏦' }
           ].map((item, i) => (
             <div key={i} className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[32px] space-y-2">
                <span className="text-2xl">{item.icon}</span>
                <h5 className="font-black text-[11px] uppercase tracking-widest text-slate-800 dark:text-white">{item.title}</h5>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </div>
      )
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-2xl overflow-hidden min-h-[600px] flex flex-col lg:flex-row">
      {/* Sidebar de Navegação */}
      <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col">
        <div className="mb-10">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">Engine Console</h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Botequista Pro OS</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {(Object.keys(panels) as Array<keyof typeof panels>).map(key => (
            <button 
              key={key} 
              onClick={() => setActivePanel(key)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activePanel === key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-900 hover:text-blue-500'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={panels[key].icon} /></svg>
              {key === 'WIKI' ? 'Wiki/Manual' : key === 'ROADMAP' ? 'Futuro v4' : panels[key].title.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Runtime: Node/React v19</span>
           </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-10 lg:p-16 overflow-y-auto max-h-[800px] no-scrollbar bg-white dark:bg-slate-900">
        <div className="mb-12 flex justify-between items-start">
           <div>
              <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic leading-none">{panels[activePanel].title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4 opacity-60">Referência técnica de engenharia de software</p>
           </div>
           <div className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700">READ-ONLY AUDIT</div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-slate-800 w-full mb-12"></div>

        {panels[activePanel].content}
      </div>
    </div>
  );
};

export default SystemDocs;