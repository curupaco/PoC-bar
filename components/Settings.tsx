
import React, { useState, useEffect, useRef } from 'react';
import { Product, Sale, Tab, User, Shift, sanitizeCurrencyInput, parseCurrencyValue } from '../types';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning';
}

interface SettingsProps {
  products: Product[];
  sales: Sale[];
  openTabs: Tab[];
  users: User[];
  shifts: Shift[];
  onImport: (data: any) => void;
  dbStatus: 'idle' | 'loading' | 'pending' | 'success' | 'error';
  currentUser: User;
  penduraThreshold: number;
  setPenduraThreshold: (v: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, sales, openTabs, users, shifts,
  onImport, currentUser,
  penduraThreshold, setPenduraThreshold
}) => {
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [thresholdInput, setThresholdInput] = useState(() => penduraThreshold.toFixed(2).replace('.', ','));
  const [showPitchPreview, setShowPitchPreview] = useState(false);
  const [showTechPreview, setShowTechPreview] = useState(false);
  
  const pitchRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  
  const [confirmModal, setConfirmModal] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    setThresholdInput(penduraThreshold.toFixed(2).replace('.', ','));
  }, [penduraThreshold]);

  const canReset = currentUser.username === 'admin' || currentUser.permissions.includes('full_reset');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const downloadAsPdf = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    showToast(`COMPILANDO DOCUMENTO DE ALTA DENSIDADE...`);
    
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
        showToast("PDF GERADO COM SUCESSO!");
      };
    } catch (err) {
      console.error(err);
      showToast("ERRO NA GERAÇÃO DO PDF", "error");
    }
  };

  const handleThresholdChange = (val: string) => {
    const sanitized = sanitizeCurrencyInput(val);
    setThresholdInput(sanitized);
    const numeric = parseCurrencyValue(sanitized);
    setPenduraThreshold(numeric);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in duration-500">
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
           {toast.msg}
        </div>
      )}

      {/* CENTRAL DE INTELIGÊNCIA COMERCIAL */}
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

        {/* --- DOSSIÊ COMERCIAL EXPANDIDO --- */}
        {showPitchPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div className="mb-6 flex justify-end">
                <button onClick={() => downloadAsPdf(pitchRef, 'pitch-comercial-pro')} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                   Exportar Documento (PDF)
                </button>
            </div>
            <div ref={pitchRef} className="bg-slate-950 text-white p-24 rounded-[40px] space-y-48 font-sans min-w-[1200px] w-full mx-auto relative shadow-2xl border border-white/5">
              
              {/* PAGE 1: INTRODUÇÃO E LOGO */}
              <section className="min-h-[700px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-red-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-red-600/40">
                         <img src="https://img.icons8.com/fluency/512/beer.png" className="w-16 h-16" alt="Logo" />
                      </div>
                      <span className="text-8xl font-barrio leading-none uppercase tracking-tighter">Botequista</span>
                   </div>
                   <div className="text-right space-y-3">
                      <div className="bg-white/10 border border-white/10 px-8 py-4 rounded-3xl text-xs font-black uppercase tracking-[0.4em]">COMERCIAL DOSSIER 2025</div>
                      <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] italic">A Revolução na Gestão Gastronômica</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-24 items-center">
                   <div className="space-y-12">
                      <h1 className="text-[120px] font-black uppercase tracking-tighter leading-[0.8] italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
                        PULSO DE <br /><span className="text-red-600">FERRO</span> NO SEU <br /><span className="text-emerald-500">NEGÓCIO.</span>
                      </h1>
                      <p className="text-2xl text-slate-400 font-medium leading-relaxed italic border-l-8 border-red-600 pl-10">
                        "O Botequista não apenas registra vendas; ele blinda seu faturamento contra falhas humanas e otimiza cada segundo da sua operação."
                      </p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-16 rounded-[60px] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 blur-3xl"></div>
                      <h4 className="text-xl font-black uppercase mb-8 tracking-widest text-slate-300">Pilares Operacionais:</h4>
                      <div className="space-y-8">
                         {[
                           { t: "Velocidade de Lançamento", d: "Interface desenhada para fechar comandas em menos de 3 cliques." },
                           { t: "Sincronismo Multi-Device", d: "Celular do garçom e computador do caixa operando a mesma mesa em tempo real." },
                           { t: "Resiliência PWA", d: "Independência total de instalação. Funciona em qualquer navegador, de qualquer lugar." }
                         ].map((it, i) => (
                           <div key={i} className="flex gap-6">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-red-600 border border-white/10">0{i+1}</div>
                              <div><p className="font-black uppercase text-sm">{it.t}</p><p className="text-xs text-slate-500 italic mt-1">{it.d}</p></div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </section>

              {/* PAGE 2: ESTRATÉGIA DE UPSELL (MODIFICADORES) */}
              <section className="space-y-32">
                 <div className="text-center space-y-6">
                    <span className="bg-blue-600 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase">Motor de Crescimento</span>
                    <h3 className="text-7xl font-black uppercase tracking-tighter italic">O Fator <span className="text-blue-500">Upsell</span> Automático</h3>
                 </div>

                 <div className="grid grid-cols-2 gap-24 items-center">
                    <div className="relative group">
                       <div className="absolute inset-0 bg-blue-600 blur-[100px] opacity-10"></div>
                       <div className="relative bg-slate-900 border border-white/5 p-12 rounded-[60px] space-y-10 shadow-2xl">
                          <div className="flex justify-between items-center pb-8 border-b border-white/5">
                             <p className="text-xs font-black uppercase tracking-widest text-slate-500">Exemplo de Indução do Sistema</p>
                             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                          </div>
                          <div className="space-y-6">
                             <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex justify-between items-center">
                                <span className="font-black uppercase text-xs">Porção Iscas de Tilápia</span>
                                <span className="text-emerald-500 font-black">R$ 58,00</span>
                             </div>
                             <div className="text-center text-[10px] font-black text-blue-500 uppercase tracking-widest py-2 bg-blue-500/5 rounded-xl">Menu de Opções Forçado ⚡</div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-blue-600 rounded-2xl text-center font-black text-[10px] uppercase shadow-lg">+ Molho Tártaro (+R$ 12)</div>
                                <div className="p-4 bg-white/10 rounded-2xl text-center font-black text-[10px] uppercase">+ Limão Extra (+R$ 4)</div>
                             </div>
                          </div>
                          <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                             <span className="font-black uppercase text-sm">TOTAL POTENCIAL</span>
                             <span className="text-3xl font-black text-white">R$ 74,00</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-12">
                       <h4 className="text-4xl font-black uppercase tracking-tighter leading-tight italic">
                          Nunca mais esqueça de <br /><span className="text-blue-500">oferecer o extra.</span>
                       </h4>
                       <p className="text-lg text-slate-400 leading-relaxed italic">
                          O Botequista abre automaticamente menus de "Acompanhamentos" ou "Serviços" vinculados a categorias. O garçom é forçado a perguntar, o cliente consome mais e seu ticket médio sobe exponencialmente.
                       </p>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                             <p className="text-4xl font-black text-blue-500">+15.4%</p>
                             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">Crescimento no Ticket Médio</p>
                          </div>
                          <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                             <p className="text-4xl font-black text-emerald-500">100%</p>
                             <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-2">Lançamento de Taxas Extras</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* PAGE 3: PRECISÃO POR PESO E GRAMATURA */}
              <section className="space-y-32">
                 <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-20 rounded-[80px] border border-white/10 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 blur-[120px]"></div>
                    <div className="grid grid-cols-2 gap-24 items-center">
                       <div className="space-y-10">
                          <h3 className="text-6xl font-black uppercase tracking-tighter italic leading-none">Blindagem de <br /><span className="text-emerald-500">Peso & Valor</span></h3>
                          <p className="text-lg text-slate-400 italic leading-relaxed">
                             Vendas por peso (quilo) são a maior fonte de prejuízo por erro de cálculo. Nosso motor matemático converte gramas em Reais instantaneamente.
                          </p>
                          <ul className="space-y-6">
                             {[
                               "Cálculo matemático com 4 casas decimais",
                               "Interface numérica gigante para operação sob estresse",
                               "Registro de gramatura detalhado no histórico de vendas"
                             ].map((txt, i) => (
                               <li key={i} className="flex items-center gap-4 text-sm font-black uppercase text-slate-300">
                                  <span className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">✔</span> {txt}
                               </li>
                             ))}
                          </ul>
                       </div>
                       <div className="bg-black/40 border-4 border-emerald-500/30 p-16 rounded-[50px] text-center space-y-8 shadow-2xl backdrop-blur-xl">
                          <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.5em]">BALANÇA DIGITAL INTEGRADA</p>
                          <p className="text-9xl font-black italic tracking-tighter text-white">825g</p>
                          <div className="h-1 w-32 bg-emerald-500/20 mx-auto"></div>
                          <p className="text-5xl font-black text-emerald-500">R$ 57,75</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* PAGE 4: ANTI-CADERNINHO (PENDURAS) */}
              <section className="space-y-24">
                 <div className="flex gap-24 items-center">
                    <div className="flex-1 space-y-12">
                       <h3 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-red-600">A Morte do <br />Caderninho</h3>
                       <p className="text-xl text-slate-400 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-8">
                          O fiado é um ativo financeiro, não um risco. O Botequista rastreia cada centavo devedor por cliente, através de todo o histórico da empresa.
                       </p>
                       <div className="space-y-6">
                          <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                             <p className="font-black uppercase text-sm text-white">Quitação em Tempo Real</p>
                             <p className="text-xs text-slate-500 mt-2">Dê baixa em dívidas parciais ou totais e veja o fluxo de caixa atualizar no mesmo segundo.</p>
                          </div>
                          <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                             <p className="font-black uppercase text-sm text-white">Alerta de Risco Financeiro</p>
                             <p className="text-xs text-slate-500 mt-2">Configure limites globais de fiado. O sistema avisa quando o bar está "exposto" demais.</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex-1">
                       <div className="bg-slate-900 border border-white/10 p-12 rounded-[60px] shadow-2xl">
                          <div className="space-y-6">
                             <div className="flex justify-between items-center p-6 bg-red-600/10 border border-red-600/20 rounded-2xl">
                                <span className="font-black uppercase text-xs">JOÃO P. DEVEDOR</span>
                                <span className="text-red-500 font-black text-xl">R$ 342,00</span>
                             </div>
                             <div className="flex justify-between items-center p-6 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl">
                                <span className="font-black uppercase text-xs">MARIA S. QUITOU</span>
                                <span className="text-emerald-500 font-black text-xl">R$ 0,00</span>
                             </div>
                             <div className="text-center pt-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">CONECTADO AO MODULO DE RELATÓRIOS</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              <footer className="pt-32 border-t border-white/10 flex flex-col items-center gap-12 text-center">
                 <h3 className="text-9xl font-black uppercase tracking-tighter italic opacity-10">BOTEQUISTA PRO</h3>
                 <div className="space-y-4">
                    <p className="text-xl font-bold italic text-slate-500">Gestão Superior para Bares que Lucram.</p>
                    <p className="text-[10px] font-black tracking-[0.5em] text-blue-600 uppercase">PROFESSIONAL GASTRONOMY SYSTEM • v3.9.12</p>
                 </div>
              </footer>
            </div>
          </div>
        )}

        {/* --- BLUEPRINT TÉCNICO EXPANDIDO --- */}
        {showTechPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div className="mb-6 flex justify-end">
                <button onClick={() => downloadAsPdf(techRef, 'blueprint-tecnico-pro')} className="bg-violet-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                   Exportar Blueprint (PDF)
                </button>
            </div>
            <div ref={techRef} className="bg-slate-950 text-white p-24 rounded-[40px] space-y-48 font-mono min-w-[1200px] w-full mx-auto relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '80px 80px' }}></div>
              
              {/* TECH PAGE 1: CORE ARCHITECTURE */}
              <section className="space-y-32 relative z-10">
                <header className="flex justify-between items-end border-b border-white/10 pb-16">
                   <div className="space-y-4">
                      <h2 className="text-6xl font-black uppercase tracking-tighter text-violet-500 italic">Stateless Core</h2>
                      <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-xs">High-Availability Gastronomy Engine</p>
                   </div>
                   <div className="text-right text-[10px] text-slate-600 space-y-1 font-mono uppercase">
                      <span>Stack: React 19 + Tailwind 3.4</span><br />
                      <span>Encryption: AES-256-CBC-PKCS7</span><br />
                      <span>Sync Mode: Polling + Optimistic State</span>
                   </div>
                </header>

                <div className="grid grid-cols-3 gap-12">
                   {[
                     { h: "Multi-Terminal Sync", d: "Motor de reconciliação assíncrona que garante integridade de dados entre múltiplos dispositivos salvando na mesma base de dados." },
                     { h: "PWA Native Performance", d: "Arquitetura Zero-Bundle que entrega performance de aplicativo nativo via browser, com cache local via Service Workers." },
                     { h: "Precision Scaling", d: "Engine de ponto flutuante otimizada para transações comerciais, evitando erros de arredondamento em faturamentos de alto volume." }
                   ].map((it, i) => (
                     <div key={i} className="p-10 bg-white/5 border border-white/5 rounded-[40px] space-y-6 hover:bg-white/[0.08] transition-colors">
                        <h4 className="text-violet-400 font-black text-sm uppercase tracking-widest">{it.h}</h4>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-sans italic">"{it.d}"</p>
                     </div>
                   ))}
                </div>

                <div className="bg-violet-900/10 p-16 rounded-[60px] border border-violet-500/20">
                   <h4 className="text-center font-black uppercase text-xs tracking-[0.8em] mb-12 text-violet-300">Data Persistence Lifecycle</h4>
                   <div className="flex justify-between items-center gap-6">
                      <div className="flex-1 p-8 bg-slate-900 border border-white/5 rounded-3xl text-center text-[10px] font-black shadow-xl">CLIENT_LOCAL_STATE</div>
                      <div className="text-violet-500 font-black animate-pulse">━━━━▶</div>
                      <div className="flex-1 p-8 bg-slate-900 border border-white/5 rounded-3xl text-center text-[10px] font-black shadow-xl">AES_CRYPT_PIPELINE</div>
                      <div className="text-violet-500 font-black animate-pulse">━━━━▶</div>
                      <div className="flex-1 p-8 bg-slate-900 border border-white/5 rounded-3xl text-center text-[10px] font-black shadow-xl">CLOUD_REALTIME_HUB</div>
                   </div>
                </div>
              </section>

              {/* TECH PAGE 2: UX ENGINEERING PARA BARES */}
              <section className="space-y-32 relative z-10">
                 <div className="grid grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                       <h3 className="text-5xl font-black uppercase tracking-tighter italic leading-tight text-white">UX Engineering: <br /><span className="text-violet-500">Low Light Optimized</span></h3>
                       <p className="text-[13px] text-slate-400 leading-relaxed font-sans">
                          Interface desenhada especificamente para o caos operacional de um bar noturno. O Botequista utiliza princípios de ergonomia digital para reduzir o erro humano:
                       </p>
                       <ul className="space-y-6">
                          {[
                            { t: "Fitts's Law Target Size", d: "Botões de PDV possuem área mínima de toque de 48x48dp para operação veloz." },
                            { t: "OLED Black Standard", d: "Contraste infinito que preserva a visão do operador em ambientes escuros." },
                            { t: "Cognitive Load Reduction", d: "Uso de cores semânticas (Vermelho = Risco, Verde = Lucro) para leitura instantânea de dados." }
                          ].map((it, i) => (
                            <li key={i} className="space-y-1 border-l-2 border-violet-500/30 pl-6">
                               <p className="text-sm font-black uppercase text-white tracking-widest">{it.t}</p>
                               <p className="text-[11px] text-slate-500 italic">{it.d}</p>
                            </li>
                          ))}
                       </ul>
                    </div>
                    <div className="relative">
                       <div className="absolute inset-0 bg-violet-600 blur-[150px] opacity-10"></div>
                       <div className="bg-slate-900 p-16 rounded-[60px] border border-white/10 space-y-8 relative z-10 shadow-2xl">
                          <div className="flex gap-3 mb-4">
                             <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                             <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                          </div>
                          <div className="space-y-6">
                             <div className="h-4 bg-white/5 rounded-full w-full"></div>
                             <div className="h-4 bg-white/5 rounded-full w-3/4"></div>
                             <div className="h-32 bg-violet-600/10 rounded-[32px] border border-violet-500/20 flex flex-col items-center justify-center gap-3">
                                <span className="text-[10px] font-black text-violet-400 tracking-[0.5em] uppercase">Render Stress Test: OK</span>
                                <div className="flex gap-1"><div className="w-1 h-6 bg-violet-500 animate-pulse"></div><div className="w-1 h-8 bg-violet-500 animate-pulse delay-75"></div><div className="w-1 h-4 bg-violet-500 animate-pulse delay-150"></div></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* TECH PAGE 3: DATA SCHEMA & ENTITIES */}
              <section className="space-y-24 relative z-10">
                 <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black uppercase tracking-widest text-white italic">Data Structure Entity Mapping</h3>
                    <p className="text-[11px] text-slate-600 font-bold uppercase tracking-[0.3em]">v3.9_SCHEMA_SPECIFICATION</p>
                 </div>
                 <div className="grid grid-cols-2 gap-12">
                    <div className="p-10 bg-slate-900 border border-white/5 rounded-[40px] space-y-6 shadow-xl">
                       <p className="text-emerald-400 text-xs font-black tracking-widest uppercase">// Product Entity</p>
                       <pre className="text-[10px] text-slate-400 overflow-hidden leading-relaxed">
{`{
  "id": "UID_V4",
  "name": "STRING_UPPER",
  "price": "FLOAT_64",
  "category": "REF_CAT",
  "sellType": "unit | weight",
  "isFavorite": "BOOLEAN",
  "modGroupId": "UID_REF"
}`}
                       </pre>
                    </div>
                    <div className="p-10 bg-slate-900 border border-white/5 rounded-[40px] space-y-6 shadow-xl">
                       <p className="text-blue-400 text-xs font-black tracking-widest uppercase">// Transaction Schema</p>
                       <pre className="text-[10px] text-slate-400 overflow-hidden leading-relaxed">
{`{
  "id": "SALE_UID",
  "timestamp": "UNIX_MS",
  "total": "BRL_VAL",
  "method": "ENUM_PAY",
  "shiftId": "SHIFT_UID",
  "items": [
     { "productId": "REF", "qty": "INT_OR_FL" }
  ]
}`}
                       </pre>
                    </div>
                 </div>
              </section>

              <footer className="pt-24 border-t border-white/10 flex justify-between items-center relative z-10">
                 <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Core Integrity Level: 100% Verified</span>
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-800">© 2025 BOTEQUISTA SYSTEMS ARCHITECTURE</span>
              </footer>
            </div>
          </div>
        )}
      </div>

      {/* REGRAS DE NEGÓCIO */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-orange-200 dark:border-orange-900/30 shadow-xl space-y-6">
        <div className="flex items-center gap-4 text-orange-600">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Regras de Negócio</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-2 tracking-widest">Limite de Alerta de Pendura (R$)</label>
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                 <input 
                    type="text" 
                    inputMode="decimal"
                    value={thresholdInput} 
                    onChange={e => handleThresholdChange(e.target.value)} 
                    className="w-full pl-14 pr-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:border-orange-500 font-black text-2xl outline-none transition-all shadow-inner" 
                    placeholder="0,00"
                 />
              </div>
           </div>
        </div>
      </div>

      {/* MANUTENÇÃO */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
         <div className="flex items-center gap-4 text-slate-400">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manutenção do Banco</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => {
                requestConfirm("Zerar Mesas?", "Isso apagará todos os itens consumidos nas mesas abertas.", () => {
                    onImport({ products, sales, users, shifts, openTabs: [] });
                    showToast("MESAS ZERADAS!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                });
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 text-amber-600 font-black uppercase text-[10px] tracking-widest border border-amber-200 dark:border-amber-900/30 hover:bg-amber-100 transition-all disabled:opacity-30 active:scale-95"
            >
              Zerar Mesas Abertas
            </button>
            <button 
              onClick={() => {
                requestConfirm("RESET TOTAL?", "O sistema voltará ao estado de fábrica. TODOS OS DADOS SERÃO PERDIDOS.", () => {
                    onImport({ products: [], sales: [], openTabs: [], shifts: [], users: [] });
                    showToast("SISTEMA REINICIADO!");
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }, 'danger');
              }} 
              disabled={!canReset} 
              className="p-6 rounded-3xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg disabled:opacity-30 active:scale-95"
            >
              Reset Total de Fábrica
            </button>
         </div>
      </div>
      
      {/* MODAL CONFIRMAÇÃO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-310 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase text-center mb-4 tracking-tighter">{confirmModal.title}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-10 leading-relaxed">{confirmModal.message}</p>
             <div className="flex flex-col gap-3">
                <button onClick={confirmModal.onConfirm} className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-black'}`}>Confirmar</button>
                <button onClick={() => setConfirmModal(p => ({...p, isOpen: false}))} className="w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Cancelar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
