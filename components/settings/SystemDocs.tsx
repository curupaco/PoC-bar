import React, { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface SystemDocsProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SystemDocs: React.FC<SystemDocsProps> = ({ showToast }) => {
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [showTechPreview, setShowTechPreview] = useState(false);
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button onClick={() => { setShowPitchPreview(!showPitchPreview); setShowTechPreview(false); }} className={`p-8 rounded-[32px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showPitchPreview ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-blue-50'}`}>
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
           <span>Dossiê Comercial (Pitch)</span>
        </button>
        <button onClick={() => { setShowTechPreview(!showTechPreview); setShowPitchPreview(false); }} className={`p-8 rounded-[32px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex flex-col items-center gap-4 ${showTechPreview ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-violet-50'}`}>
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
           <span>Blueprint Técnico (Branco)</span>
        </button>
      </div>

      {showPitchPreview && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
          <div className="mb-6 flex justify-end">
              <button onClick={() => downloadAsPdf(pitchRef, 'pitch-comercial-pro')} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Exportar Documento (PDF)
              </button>
          </div>
          <div ref={pitchRef} className="bg-slate-950 text-white p-0 rounded-[40px] font-sans min-w-[1200px] w-full mx-auto relative shadow-2xl border border-white/5 overflow-hidden">
            
            {/* PÁGINA 1: CAPA */}
            <div className="min-h-[850px] relative p-24 flex flex-col justify-between bg-gradient-to-br from-slate-950 to-slate-900 border-b-8 border-red-600">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"></div>
               <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-white text-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
                        {/* ÍCONE CANECA DE CHOPP CORRIGIDO */}
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8v11a2 2 0 002 2h8a2 2 0 002-2V8M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2M6 8h12M18 10h2a2 2 0 012 2v3a2 2 0 01-2 2h-2M10 12v6M14 12v6" /></svg>
                     </div>
                     <span className="text-4xl font-barrio uppercase">Botequista</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Proposta Comercial 2026</div>
               </div>
               <div className="relative z-10">
                  <h1 className="text-[140px] leading-[0.85] font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                     A Evolução <br />Do <span className="text-red-600">Lucro.</span>
                  </h1>
                  <p className="mt-12 text-3xl font-light text-slate-400 max-w-4xl border-l-4 border-red-600 pl-8">
                     O sistema operacional definitivo para bares de alto giro que não podem perder um segundo.
                  </p>
               </div>
               <div className="relative z-10 flex gap-8">
                  <div className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                     <span className="block text-2xl font-black text-red-500">30%</span>
                     <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Aumento de Giro</span>
                  </div>
                  <div className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10">
                     <span className="block text-2xl font-black text-emerald-500">0%</span>
                     <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Erros de Soma</span>
                  </div>
               </div>
            </div>

            {/* PÁGINA 2: O PROBLEMA */}
            <div className="min-h-[850px] relative p-24 flex flex-col justify-center bg-white text-slate-900 border-b-8 border-slate-900">
               <div className="grid grid-cols-2 gap-24">
                  <div className="space-y-10">
                     <span className="text-red-600 font-black text-sm uppercase tracking-[0.4em]">Cenário Atual</span>
                     <h2 className="text-7xl font-black uppercase tracking-tighter leading-none italic">
                        Onde seu <br />dinheiro <span className="text-red-600 text-8xl">SOME?</span>
                     </h2>
                     <p className="text-xl text-slate-500 leading-relaxed font-medium">
                        A operação manual ou sistemas antigos geram "micro-furos" diários que destroem sua margem de lucro silenciosamente.
                     </p>
                  </div>
                  <div className="grid gap-6">
                     {[
                        { title: "Esquecimento de Adicionais", desc: "Garçom esquece de cobrar o limão, o gelo ou a cobertura extra.", icon: "💸" },
                        { title: "Contas de Papel", desc: "Somas erradas na calculadora em horários de pico.", icon: "🧮" },
                        { title: "Fiado Sem Controle", desc: "Anotações em cadernos que se perdem ou são ilegíveis.", icon: "📓" }
                     ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 flex gap-6 items-start hover:shadow-xl transition-shadow">
                           <span className="text-4xl">{item.icon}</span>
                           <div>
                              <h4 className="text-xl font-black uppercase tracking-tight mb-2">{item.title}</h4>
                              <p className="text-sm text-slate-500">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* PÁGINA 3: A SOLUÇÃO */}
            <div className="min-h-[850px] relative p-24 bg-slate-950 flex flex-col justify-center border-b-8 border-emerald-500">
               <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               <div className="relative z-10 text-center space-y-16">
                  <span className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em]">Tecnologia de Ponta</span>
                  <h2 className="text-8xl font-black uppercase tracking-tighter text-white italic">
                     Botequista <span className="text-emerald-500">Pro</span>
                  </h2>
                  <div className="grid grid-cols-3 gap-8 text-left">
                     <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] space-y-6">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                        <h3 className="text-2xl font-black uppercase text-white">Velocidade Extrema</h3>
                        <p className="text-slate-400 text-sm">Interface desenhada para registrar vendas em menos de 3 toques. Fila zero no caixa.</p>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] space-y-6 transform -translate-y-8 border-t-4 border-t-emerald-500">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg></div>
                        <h3 className="text-2xl font-black uppercase text-white">Nuvem Híbrida</h3>
                        <p className="text-slate-400 text-sm">Dados sincronizados em tempo real, com modo offline automático para segurança total.</p>
                     </div>
                     <div className="bg-slate-900 border border-slate-800 p-10 rounded-[40px] space-y-6">
                        <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <h3 className="text-2xl font-black uppercase text-white">Controle Total</h3>
                        <p className="text-slate-400 text-sm">Relatórios financeiros detalhados e gestão de estoque na palma da sua mão.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showTechPreview && (
        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 flex justify-center">
            <div ref={techRef} className="bg-white p-20 rounded-[40px] shadow-2xl border border-slate-200 min-w-[1000px] text-center space-y-8">
               <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Blueprint Técnico</h2>
               <p className="text-slate-500">Arquitetura de dados segura com criptografia ponta a ponta.</p>
               <div className="grid grid-cols-3 gap-8">
                   <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                      <h4 className="font-black uppercase mb-2">Frontend</h4>
                      <p className="text-xs text-slate-500">React + TypeScript + Tailwind</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                      <h4 className="font-black uppercase mb-2">Backend</h4>
                      <p className="text-xs text-slate-500">Serverless (Firebase)</p>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
                      <h4 className="font-black uppercase mb-2">Segurança</h4>
                      <p className="text-xs text-slate-500">AES-256 + SHA-256</p>
                   </div>
               </div>
            </div>
             <div className="ml-4 flex flex-col justify-start">
              <button onClick={() => downloadAsPdf(techRef, 'blueprint-tecnico')} className="bg-violet-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">
                 Baixar PDF
              </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default SystemDocs;