import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface SystemDocsProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SystemDocs: React.FC<SystemDocsProps> = ({ showToast }) => {
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [showTechPreview, setShowTechPreview] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showFlowchart, setShowFlowchart] = useState(false);
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const mindMapRef = useRef<HTMLDivElement>(null);
  const flowchartRef = useRef<HTMLDivElement>(null);

  const downloadAsPdf = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    showToast(`COMPILANDO DOCUMENTO DE ALTA DENSIDADE...`, 'success');
    
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { 
        pixelRatio: 1.5, 
        backgroundColor: '#020617',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeightInPdf;
        let position = 0;

        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
          heightLeft -= pdfHeight;
        }

        pdf.save(`botequista-${fileName}.pdf`);
        showToast("PDF GERADO COM SUCESSO!", 'success');
      };
    } catch (err) {
      console.error(err);
      showToast("ERRO NA GERAÇÃO DO PDF", "error");
    }
  };

  const closeAll = () => {
    setShowPitchPreview(false);
    setShowTechPreview(false);
    setShowMindMap(false);
    setShowFlowchart(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-xl space-y-10">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Documentos de Autoridade</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Dossiês de Venda e Arquitetura Técnica</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => { closeAll(); setShowPitchPreview(true); }} className={`p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showPitchPreview ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-blue-50'}`}>
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
           <span>Pitch Comercial</span>
        </button>
        <button onClick={() => { closeAll(); setShowTechPreview(true); }} className={`p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showTechPreview ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-violet-50'}`}>
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
           <span>Blueprint Técnico</span>
        </button>
        <button onClick={() => { closeAll(); setShowMindMap(true); }} className={`p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showMindMap ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-emerald-50'}`}>
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
           <span>Mapa Mental</span>
        </button>
        <button onClick={() => { closeAll(); setShowFlowchart(true); }} className={`p-6 rounded-[28px] font-black uppercase text-[10px] tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showFlowchart ? 'bg-amber-600 text-white ring-4 ring-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-amber-50'}`}>
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
           <span>Fluxo Multi-Bar</span>
        </button>
      </div>

      {/* PREVIEW: MAPA MENTAL (ATUAL) */}
      {showMindMap && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 overflow-x-auto">
          <div className="mb-6 flex justify-between items-center">
              <h4 className="text-sm font-black uppercase text-slate-400 italic">Arquitetura v3.9 (Estado Atual)</h4>
              <button onClick={() => downloadAsPdf(mindMapRef, 'arquitetura-atual')} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Salvar PDF
              </button>
          </div>
          <div ref={mindMapRef} className="bg-slate-950 p-24 rounded-[40px] min-w-[1200px] border border-white/5 relative flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
             
             {/* CENTRO */}
             <div className="relative z-10 w-64 h-64 bg-emerald-600 rounded-[50px] flex flex-col items-center justify-center text-center shadow-[0_0_80px_rgba(16,185,129,0.3)] border-4 border-emerald-400">
                <img src="https://img.icons8.com/fluency/512/beer.png" className="w-20 h-20 mb-2" />
                <span className="text-white font-barrio text-3xl">Botequista</span>
                <span className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Core Engine v3.9</span>
             </div>

             {/* RAMIFICAÇÕES ESQUERDA: ENGINE */}
             <div className="absolute left-24 top-1/2 -translate-y-1/2 space-y-8">
                {[
                  { title: "SyncQueue", desc: "Fila Offline Persistente", icon: "🕒" },
                  { title: "SmartMerge", desc: "Fusão de Dados 120s", icon: "🧠" },
                  { title: "RBAC Security", desc: "Autoridade Granular", icon: "🔐" }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-emerald-500/30 w-64 relative group hover:border-emerald-500 transition-all">
                    <div className="absolute left-full top-1/2 -translate-y-1/2 w-32 h-1 bg-emerald-500/20"></div>
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <h5 className="text-white font-black uppercase text-xs tracking-tight">{item.title}</h5>
                    <p className="text-emerald-500 text-[9px] font-bold uppercase">{item.desc}</p>
                  </div>
                ))}
             </div>

             {/* RAMIFICAÇÕES DIREITA: UI & DATA */}
             <div className="absolute right-24 top-1/2 -translate-y-1/2 space-y-8">
                {[
                  { title: "Firebase RTDB", desc: "Nó Único (Flat Structure)", icon: "☁️" },
                  { title: "PWA Service", desc: "Cache & Ativos Locais", icon: "📱" },
                  { title: "Audit Log", desc: "Anulação Rastreável", icon: "📋" }
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/80 backdrop-blur-md p-6 rounded-[32px] border border-blue-500/30 w-64 relative text-right group hover:border-blue-500 transition-all">
                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-32 h-1 bg-blue-500/20"></div>
                    <span className="text-2xl mb-2 block">{item.icon}</span>
                    <h5 className="text-white font-black uppercase text-xs tracking-tight">{item.title}</h5>
                    <p className="text-blue-500 text-[9px] font-bold uppercase">{item.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* PREVIEW: FLUXO MULTI-BAR (FUTURO) */}
      {showFlowchart && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 overflow-x-auto">
          <div className="mb-6 flex justify-between items-center">
              <h4 className="text-sm font-black uppercase text-slate-400 italic">Estrutura Multi-Tenant (Escalabilidade)</h4>
              <button onClick={() => downloadAsPdf(flowchartRef, 'fluxo-multibar')} className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Salvar PDF
              </button>
          </div>
          <div ref={flowchartRef} className="bg-slate-950 p-24 rounded-[40px] min-w-[1200px] border border-white/5 relative flex flex-col items-center gap-16">
             <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#f59e0b 0.5px, transparent 0.5px), linear-gradient(90deg, #f59e0b 0.5px, transparent 0.5px)', backgroundSize: '40px 40px'}}></div>

             {/* CAMADA 1: ADMIN CENTRAL */}
             <div className="bg-amber-600 p-8 rounded-[40px] border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center relative z-20">
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest block mb-2">Orquestrador de Plataforma</span>
                <h3 className="text-white text-3xl font-black italic uppercase tracking-tighter">Botequista Console</h3>
                <div className="mt-4 flex gap-2 justify-center">
                   <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-white">GESTÃO DE BARES</span>
                   <span className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black text-white">FATURAMENTO GLOBAL</span>
                </div>
             </div>

             <div className="w-1 h-16 bg-gradient-to-b from-amber-500 to-slate-800"></div>

             {/* CAMADA 2: SELETOR DE CONTEXTO */}
             <div className="w-full grid grid-cols-2 gap-32 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-slate-800 -translate-y-8"></div>
                
                <div className="space-y-8">
                   <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-[40px] relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 text-slate-400 rounded-full text-[8px] font-black">UNIDADE A</div>
                      <h5 className="text-white font-black text-xl text-center uppercase italic">Bar do Porto</h5>
                      <div className="mt-6 space-y-2">
                         <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center opacity-60">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Cardápio Próprio</span>
                            <span className="text-emerald-500">✔</span>
                         </div>
                         <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center opacity-60">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Base de Dados Isolada</span>
                            <span className="text-emerald-500">✔</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-900 border-2 border-slate-700 p-8 rounded-[40px] relative">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 text-slate-400 rounded-full text-[8px] font-black">UNIDADE B</div>
                      <h5 className="text-white font-black text-xl text-center uppercase italic">Bar da Esquina</h5>
                      <div className="mt-6 space-y-2">
                         <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center opacity-60">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Cardápio Próprio</span>
                            <span className="text-emerald-500">✔</span>
                         </div>
                         <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center opacity-60">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Base de Dados Isolada</span>
                            <span className="text-emerald-500">✔</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-10 p-8 bg-white/5 border border-white/10 rounded-[40px] max-w-2xl text-center">
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                   <span className="text-amber-500 font-black">CONCEITO DE "TENANCY":</span> O sistema deixa de salvar na raiz e passa a salvar no nó 
                   <code className="mx-2 bg-slate-900 px-2 py-1 rounded text-amber-200">/tenants/barId/products</code>.
                   A lógica de sincronização (Engine) permanece a mesma, mudando apenas o prefixo do banco.
                </p>
             </div>
          </div>
        </div>
      )}

      {/* FOOTER DOCS */}
      <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center">
               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso Restrito ao Nível Administrativo</p>
         </div>
         <p className="text-[9px] font-bold text-slate-400 uppercase italic">Estes documentos servem para auditoria e apresentações de investimento.</p>
      </div>

      {/* MODAL CONFIRMAÇÃO (REUTILIZADO DO SETTINGS SE NECESSÁRIO) */}
    </div>
  );
};

export default SystemDocs;