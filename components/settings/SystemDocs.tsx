import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface SystemDocsProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SystemDocs: React.FC<SystemDocsProps> = ({ showToast }) => {
  const [activeDoc, setActiveDoc] = useState<'PITCH' | 'TECH' | 'MINDMAP' | 'FLOWCHART' | null>(null);
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<HTMLDivElement>(null);
  const flowchartRef = useRef<HTMLDivElement>(null);

  const downloadAsPdf = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    showToast(`COMPILANDO DOCUMENTO DE ALTA DENSIDADE...`, 'success');
    
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { 
        pixelRatio: 2, 
        backgroundColor: '#020617',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`botequista-${fileName}.pdf`);
      showToast("PDF GERADO COM SUCESSO!", 'success');
    } catch (err) {
      console.error(err);
      showToast("ERRO NA GERAÇÃO DO PDF", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-xl space-y-10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none italic">Dossiê de Autoridade</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Documentos de Venda, Engenharia e Escala</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'PITCH', label: 'Pitch Comercial', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'blue' },
          { id: 'TECH', label: 'Blueprint Técnico', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: 'violet' },
          { id: 'MINDMAP', label: 'Engenharia Atual', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'emerald' },
          { id: 'FLOWCHART', label: 'Visão Multi-Bar', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4', color: 'amber' }
        ].map((btn) => (
          <button 
            key={btn.id}
            onClick={() => setActiveDoc(btn.id as any)} 
            className={`p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex flex-col items-center gap-4 border-2 ${activeDoc === btn.id ? `bg-${btn.color}-600 text-white border-${btn.color}-400 ring-8 ring-${btn.color}-500/10` : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
          >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={btn.icon} /></svg>
             <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {activeDoc === 'PITCH' && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-6">
          <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-black uppercase text-blue-600 italic">Proposta de Valor e ROI Operacional</h4>
              <button onClick={() => downloadAsPdf(pitchRef, 'pitch-comercial')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Exportar PDF</button>
          </div>
          <div ref={pitchRef} className="bg-slate-950 p-24 rounded-[60px] min-w-[1200px] border border-white/5 space-y-16 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
             <div className="text-center relative z-10">
                <h1 className="text-blue-500 font-barrio text-7xl mb-6">Botequista Pro</h1>
                <p className="text-white font-black uppercase tracking-[0.5em] text-sm">Operação de Elite para Bares de Alta Performance</p>
             </div>
             <div className="grid grid-cols-3 gap-12 relative z-10">
                <div className="bg-white/5 p-12 rounded-[50px] border border-white/10 space-y-6">
                   <h3 className="text-blue-400 font-black uppercase text-xl italic tracking-tighter">Vazamento Zero</h3>
                   <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase">Controle rigoroso de anulações com auditoria por ID de usuário. Reduza perdas ocultas em até 18% no primeiro mês.</p>
                </div>
                <div className="bg-white/5 p-12 rounded-[50px] border border-white/10 space-y-6">
                   <h3 className="text-emerald-400 font-black uppercase text-xl italic tracking-tighter">Agilidade Extrema</h3>
                   <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase">Lançamento em 2 toques com favoritos e modificadores inteligentes. Menos tempo de tela, mais tempo servindo.</p>
                </div>
                <div className="bg-white/5 p-12 rounded-[50px] border border-white/10 space-y-6">
                   <h3 className="text-amber-400 font-black uppercase text-xl italic tracking-tighter">Conferência Cega</h3>
                   <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase">Fechamento de caixa baseado em contagem física real, forçando a honestidade e precisão no fluxo financeiro.</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeDoc === 'TECH' && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-6">
          <div className="flex justify-between items-center bg-violet-50 dark:bg-violet-900/20 p-6 rounded-3xl border border-violet-100 dark:border-violet-800">
              <h4 className="text-sm font-black uppercase text-violet-600 italic">Blueprint de Engenharia de Software</h4>
              <button onClick={() => downloadAsPdf(techRef, 'blueprint-tecnico')} className="bg-violet-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Exportar PDF</button>
          </div>
          <div ref={techRef} className="bg-slate-950 p-24 rounded-[60px] min-w-[1200px] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full"></div>
             <div className="grid grid-cols-2 gap-20 relative z-10">
                <div className="space-y-12">
                   <h2 className="text-violet-500 font-black text-4xl uppercase tracking-tighter italic">Stack & Infra v3.9</h2>
                   <div className="space-y-6">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-violet-600/20 rounded-2xl flex items-center justify-center text-violet-400 font-black text-xl">FE</div>
                         <div><p className="text-white font-black text-lg">React 19 + TypeScript</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Client-Side Engine / PWA Resiliente</p></div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xl">DB</div>
                         <div><p className="text-white font-black text-lg">Firebase Realtime DB</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Estrutura Granular (NoSQL Flat Schema)</p></div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl">SC</div>
                         <div><p className="text-white font-black text-lg">AES-256 + SHA-256</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Segurança Bancária de Dados em Repouso</p></div>
                      </div>
                   </div>
                </div>
                <div className="space-y-10">
                   <h2 className="text-emerald-500 font-black text-4xl uppercase tracking-tighter italic">Engine Logic</h2>
                   <div className="bg-slate-900 p-10 rounded-[50px] border border-white/10 shadow-inner">
                      <pre className="text-emerald-400 font-mono text-[11px] leading-relaxed">
{`// Algoritmo de Sincronismo v3.9.46
const SyncWorker = () => {
  const diff = Date.now() - local.ts;
  if (diff < GRACE_PERIOD_MS) {
    return local_authority; // Garçom vence conflito
  }
  return server_authority;
}

// Persistência Offline
SyncQueue.persist(localStorage);
QueueWorker.run(interval: 2000ms);`}
                      </pre>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeDoc === 'MINDMAP' && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-6">
          <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
              <h4 className="text-sm font-black uppercase text-emerald-600 italic">Mapa Mental: Engenharia de Fluxo Atual</h4>
              <button onClick={() => downloadAsPdf(mindMapRef, 'mindmap-granular')} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Exportar PDF</button>
          </div>
          <div ref={mindMapRef} className="bg-slate-950 p-24 rounded-[60px] min-w-[1400px] border border-white/5 relative grid grid-cols-3 gap-24 overflow-hidden text-slate-400 font-bold uppercase text-[11px] tracking-wider">
             <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#10b981 1.5px, transparent 1.5px)', backgroundSize: '40px 40px'}}></div>
             <div className="space-y-12 relative z-10">
                <div className="bg-emerald-900/20 border-l-8 border-emerald-500 p-10 rounded-3xl space-y-4">
                   <h5 className="text-emerald-500 font-black text-lg italic">Sync Engine</h5>
                   <p>• SyncQueue: Poll 2s (LocalStorage)</p>
                   <p>• SmartMerge: Protection 120s</p>
                   <p>• Heartbeat: Sync Check 4s</p>
                   <p>• Exp. Backoff: 2x Retry</p>
                </div>
                <div className="bg-blue-900/20 border-l-8 border-blue-500 p-10 rounded-3xl space-y-4">
                   <h5 className="text-blue-500 font-black text-lg italic">Auth & Permissions</h5>
                   <p>• RBAC: 19 Chaves de Acesso</p>
                   <p>• Session: Persistent JWT</p>
                   <p>• Auditoria: DeletedAt/UserId Flags</p>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center relative z-10">
                <div className="w-72 h-72 bg-emerald-600 rounded-[80px] flex flex-col items-center justify-center text-center shadow-[0_0_120px_rgba(16,185,129,0.3)] border-8 border-emerald-400 animate-pulse">
                   <img src="https://img.icons8.com/fluency/512/beer.png" className="w-24 h-24 mb-4" />
                   <span className="text-white font-barrio text-4xl">Botequista</span>
                   <span className="text-emerald-200 text-[11px] font-black uppercase tracking-[0.4em] mt-2 italic">v3.9.46 PRO</span>
                </div>
             </div>
             <div className="space-y-12 relative z-10">
                <div className="bg-amber-900/20 border-r-8 border-amber-500 p-10 rounded-3xl space-y-4 text-right">
                   <h5 className="text-amber-500 font-black text-lg italic">Data Schema</h5>
                   <p>/products: {`{id, name, price, sellType}`}</p>
                   <p>/sales: {`{items[], method, deleted}`}</p>
                   <p>/shifts: {`{status, openingCash}`}</p>
                   <p>/tabs: {`{openedAt, items[]}`}</p>
                </div>
                <div className="bg-indigo-900/20 border-r-8 border-indigo-500 p-10 rounded-3xl space-y-4 text-right">
                   <h5 className="text-indigo-500 font-black text-lg italic">BI & Logic</h5>
                   <p>• Curva ABC Financeira</p>
                   <p>• Heatmap Operacional (Hour)</p>
                   <p>• Ticket Médio Dinâmico</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeDoc === 'FLOWCHART' && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-6">
          <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800">
              <h4 className="text-sm font-black uppercase text-amber-600 italic">Visão de Futuro: Arquitetura Multi-Tenant</h4>
              <button onClick={() => downloadAsPdf(flowchartRef, 'fluxo-multibar')} className="bg-amber-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Exportar PDF</button>
          </div>
          <div ref={flowchartRef} className="bg-slate-950 p-24 rounded-[60px] min-w-[1400px] border border-white/5 flex flex-col items-center gap-20 relative overflow-hidden">
             <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(#f59e0b 0.5px, transparent 0.5px), linear-gradient(90deg, #f59e0b 0.5px, transparent 0.5px)', backgroundSize: '60px 60px'}}></div>
             <div className="bg-amber-600 p-12 rounded-[50px] border-8 border-amber-400 text-white font-black text-center w-full max-w-4xl shadow-2xl relative z-20">
                <span className="text-amber-200 text-xs uppercase tracking-[0.4em] mb-4 block">Orquestrador Global v4.0</span>
                <h3 className="text-6xl italic uppercase tracking-tighter">Botequista Console Admin</h3>
             </div>
             <div className="w-full grid grid-cols-3 gap-12 relative z-20">
                {['UNIDADE ALPHA (MATRIZ)', 'UNIDADE BETA (SHOPPING)', 'UNIDADE GAMMA (LITORAL)'].map((b, i) => (
                  <div key={b} className="bg-slate-900 p-12 rounded-[50px] border-4 border-slate-800 text-center space-y-6">
                    <h5 className="text-white font-black text-2xl italic tracking-tight uppercase">{b}</h5>
                    <div className="h-px bg-slate-700 w-1/2 mx-auto"></div>
                    <p className="text-[10px] text-amber-500 font-mono tracking-tighter">firebase.com/data/bars/ID_TENANT_0{i+1}/...</p>
                    <div className="flex justify-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                       <span className="text-[9px] font-black text-slate-500 uppercase">Isolamento Ativo</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* ROADMAP ESTRATÉGICO v4.0 */}
      <div className="bg-slate-50 dark:bg-slate-950/50 p-12 rounded-[50px] border border-slate-100 dark:border-slate-800 space-y-10 animate-in slide-in-from-bottom-4">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/20">
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
               <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Roadmap Estratégico v4.0.0</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Próximos passos para a dominância de mercado</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Fase 1: Inquilinos', title: 'Isolamento Multi-Bar', desc: 'Roteamento via TenantID no Firebase. Cada unidade com seu banco de dados isolado e criptografado individualmente.', color: 'blue' },
              { label: 'Fase 2: Admin Hub', title: 'BI Global Consolidado', desc: 'Painel Central para o dono da rede. KPIs unificados, ticket médio global e ranking de desperdício por unidade.', color: 'emerald' },
              { label: 'Fase 3: Inteligência', title: 'Gestão por IA (Gemini)', desc: 'Previsão de estoque baseada em eventos sazonais e histórico de vendas. Alerta de falta de insumos em tempo real.', color: 'amber' },
              { label: 'Fase 4: Ecossistema', title: 'Plataforma White-Label', desc: 'Interface customizável para branding do bar. App nativo para garçons com comunicação direta com a cozinha.', color: 'violet' }
            ].map((step, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-4 hover:shadow-2xl transition-all cursor-default group">
                 <span className={`text-[10px] font-black text-${step.color}-500 uppercase tracking-widest bg-${step.color}-50 dark:bg-${step.color}-900/20 px-4 py-1.5 rounded-full`}>{step.label}</span>
                 <h5 className="font-black text-base uppercase italic group-hover:text-red-500 transition-colors tracking-tighter">{step.title}</h5>
                 <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase">{step.desc}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-blue-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Documentação Estruturada para Crescimento Exponencial</p>
         </div>
         <p className="text-[9px] font-bold text-slate-400 uppercase italic">© 2025 Botequista Pro Software Engine.</p>
      </div>
    </div>
  );
};

export default SystemDocs;