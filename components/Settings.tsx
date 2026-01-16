
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

  /**
   * MOTOR DE EXPORTAÇÃO PDF MULTI-PÁGINA (LANDSCAPE)
   * Captura o elemento e fatia em páginas A4 Paisagem (297x210mm)
   */
  const downloadAsPdf = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    showToast(`CAPTURANDO DOCUMENTO...`);
    
    try {
      const dataUrl = await htmlToImage.toPng(ref.current, { 
        pixelRatio: 2, 
        backgroundColor: '#020617',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        // Criar PDF em modo Paisagem (Landscape)
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
        
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeightInPdf;
        let position = 0;

        // Adiciona a primeira página
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;

        // Enquanto houver altura sobrando da imagem, adiciona páginas e desloca
        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
          heightLeft -= pdfHeight;
        }

        pdf.save(`botequista-${fileName}.pdf`);
        showToast("PDF PROFISSIONAL GERADO!");
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

      {/* CENTRAL DE VENDAS E ENGENHARIA */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Dossiês de Prospecção</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Material Premium em PDF Paisagem (Múltiplas Páginas)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4 text-center">
             <button onClick={() => { setShowPitchPreview(!showPitchPreview); setShowTechPreview(false); }} className={`w-full py-6 rounded-[28px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-3 ${showPitchPreview ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {showPitchPreview ? "Fechar Visualização" : "Abrir Proposta Comercial"}
             </button>
             {showPitchPreview && (
                <button onClick={() => downloadAsPdf(pitchRef, 'dossie-comercial-ultra')} className="w-full bg-slate-950 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl animate-in zoom-in-95">
                  Exportar PDF (Paisagem)
                </button>
             )}
          </div>

          <div className="space-y-4 text-center">
             <button onClick={() => { setShowTechPreview(!showTechPreview); setShowPitchPreview(false); }} className={`w-full py-6 rounded-[28px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-3 ${showTechPreview ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {showTechPreview ? "Fechar Visualização" : "Abrir Blueprint Técnico"}
             </button>
             {showTechPreview && (
                <button onClick={() => downloadAsPdf(techRef, 'whitepaper-tecnico-ultra')} className="w-full bg-slate-950 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl animate-in zoom-in-95">
                  Exportar PDF Técnico
                </button>
             )}
          </div>
        </div>

        {/* --- PROPOSTA COMERCIAL MEGA DOCUMENTO (ESTILO LANDSCAPE) --- */}
        {showPitchPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div ref={pitchRef} className="bg-slate-950 text-white p-24 rounded-[40px] space-y-40 font-sans min-w-[1100px] w-full mx-auto overflow-hidden relative shadow-2xl border border-white/5">
              
              {/* PAGE 1: CAPA */}
              <section className="min-h-[600px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-8">
                      <img src="https://img.icons8.com/fluency/512/beer.png" className="w-28 h-28" alt="Logo" />
                      <span className="text-8xl font-barrio leading-none uppercase tracking-tighter">Botequista</span>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="bg-red-600 px-12 py-5 rounded-full text-xs font-black uppercase tracking-[0.5em] shadow-xl shadow-red-600/30">PRO EDITION 2025</div>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest italic">O Futuro da Gestão de Bares</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-20 items-end">
                   <div className="space-y-10">
                      <h1 className="text-[110px] font-black uppercase tracking-tighter leading-[0.75] italic">
                        LUCRO É <br /><span className="text-red-600">CONTROLE.</span> <br /><span className="text-blue-500">SEMPRE.</span>
                      </h1>
                      <div className="h-2 w-48 bg-blue-600 rounded-full"></div>
                   </div>
                   <div className="space-y-8 pb-4">
                      <p className="text-3xl text-slate-400 font-medium leading-relaxed italic border-l-8 border-red-600 pl-10">
                        "O Botequista não é apenas um software, é a blindagem financeira que seu bar precisa para crescer sem desperdícios."
                      </p>
                      <div className="flex gap-12">
                         <div className="text-center">
                            <p className="text-4xl font-black text-white">+30%</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agilidade no Atendimento</p>
                         </div>
                         <div className="text-center">
                            <p className="text-4xl font-black text-emerald-500">100%</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Previsibilidade de Caixa</p>
                         </div>
                      </div>
                   </div>
                </div>
              </section>

              {/* PAGE 2: ANÁLISE DE IMPACTO */}
              <section className="space-y-24 border-t border-white/5 pt-32">
                <div className="text-center space-y-6">
                   <h3 className="text-6xl font-black uppercase tracking-tighter italic">O Custo do Caos</h3>
                   <p className="text-slate-500 text-xl max-w-4xl mx-auto uppercase font-bold tracking-[0.2em]">Sem uma gestão profissional, você está deixando dinheiro na mesa:</p>
                </div>

                <div className="grid grid-cols-3 gap-12">
                   {[
                     { t: "FALHA DE COMANDA", p: "R$ 450/mês", d: "Itens consumidos que não são cobrados por esquecimento do garçom." },
                     { t: "FIADO SEM IDENTIDADE", p: "R$ 800/mês", d: "Caderninhos perdidos e cobranças impossíveis de rastrear historicamente." },
                     { t: "ESTOQUE MORTO", p: "R$ 300/mês", d: "Produtos vencidos ou esquecidos no fundo do freezer sem giro inteligente." }
                   ].map((item, i) => (
                     <div key={i} className="bg-white/5 p-12 rounded-[60px] border border-white/5 space-y-6">
                        <p className="text-red-600 font-black text-3xl mb-2">{item.p} <span className="text-xs text-slate-500 italic">(Média)</span></p>
                        <h4 className="text-xl font-black uppercase tracking-tighter">{item.t}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed italic">"{item.d}"</p>
                     </div>
                   ))}
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-16 rounded-[80px] flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden gap-10">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                   <div className="relative z-10 space-y-4 text-center md:text-left">
                      <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-100">Projeção de ROI</p>
                      <h4 className="text-5xl font-black uppercase tracking-tighter">RETORNO EM 2 SEMANAS</h4>
                   </div>
                   <div className="relative z-10 bg-slate-950 px-16 py-8 rounded-[40px] font-black text-2xl tracking-widest shadow-2xl">
                      ESTIMATIVA: +R$ 1.550,00/MÊS NO BOLSO
                   </div>
                </div>
              </section>

              {/* PAGE 3: PROTOCOLO OPERACIONAL */}
              <section className="space-y-24">
                 <div className="flex gap-24 items-center">
                    <div className="flex-1 space-y-12">
                       <h3 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-red-600">Protocolo <br />"Gelo na Caneca"</h3>
                       <p className="text-2xl text-slate-400 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-8">
                          Desenvolvemos a interface para a pressão do sábado à noite. Zero cliques inúteis, foco total na venda.
                       </p>
                       <ul className="space-y-8">
                          {[
                            "Lançamentos em 2 toques (Favoritos Dinâmicos)",
                            "Cálculo de Peso automático para porções e carnes",
                            "Sincronia instantânea em ilimitados dispositivos",
                            "Fechamento de turno 'Cego' (Anti-fraude)"
                          ].map((li, i) => (
                            <li key={i} className="text-lg font-black uppercase tracking-widest flex items-center gap-6">
                               <span className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 text-sm">✔</span>
                               {li}
                            </li>
                          ))}
                       </ul>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-8">
                       <div className="bg-slate-900 p-12 rounded-[60px] border border-white/5 space-y-8 shadow-inner">
                          <p className="text-6xl">⚡</p>
                          <h5 className="font-black text-sm uppercase tracking-[0.3em] text-slate-400">VELOCIDADE</h5>
                          <p className="text-xs text-slate-500 leading-relaxed italic">Atendimento 40% mais rápido que comandas de papel ou sistemas legados.</p>
                       </div>
                       <div className="bg-slate-900 p-12 rounded-[60px] border border-white/5 space-y-8 mt-16 shadow-inner">
                          <p className="text-6xl">📊</p>
                          <h5 className="font-black text-sm uppercase tracking-[0.3em] text-slate-400">BIG DATA</h5>
                          <p className="text-xs text-slate-500 leading-relaxed italic">Saiba exatamente qual é o seu horário de pico e qual produto mais gera lucro.</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* FINAL CTA */}
              <footer className="pt-32 border-t border-white/10 flex flex-col items-center gap-16 relative z-10">
                 <div className="text-center space-y-6">
                    <p className="text-xs font-black uppercase tracking-[0.6em] text-red-600">Botequista Systems Inc. - 2025</p>
                    <h3 className="text-9xl font-black uppercase tracking-tighter italic">VAMOS <span className="text-blue-500">BLINDAR?</span></h3>
                 </div>
                 <div className="bg-white text-slate-950 px-24 py-10 rounded-[40px] font-black text-2xl tracking-widest shadow-2xl hover:scale-105 transition-all">
                    SOLICITAR SETUP COMPLETO →
                 </div>
                 <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">www.botequista.com.br | © Todos os direitos reservados</p>
              </footer>
            </div>
          </div>
        )}

        {/* --- BLUEPRINT TÉCNICO ULTRA DETALHADO (ESTILO LANDSCAPE) --- */}
        {showTechPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div ref={techRef} className="bg-slate-950 text-white p-24 rounded-[40px] space-y-40 font-mono min-w-[1100px] w-full mx-auto overflow-hidden relative shadow-2xl border border-white/5">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
              
              {/* TECH PAGE 1: ARQUITETURA */}
              <header className="flex justify-between items-start relative z-10 border-b border-white/10 pb-16">
                <div className="space-y-4">
                   <h2 className="text-6xl font-black uppercase tracking-tighter">BTQ-CORE v3.1</h2>
                   <p className="text-violet-500 font-bold uppercase tracking-[0.6em] text-sm italic">High-Performance Stateless Engine for Gastronomy</p>
                </div>
                <div className="text-right text-[11px] text-slate-500 uppercase leading-relaxed font-mono">
                  Stack: React 19 / TypeScript 5.7 / Tailwind 3.4<br />
                  Persistence: Cloud-Synced Stateless Operations<br />
                  Status: PRODUCTION-READY_LTS
                </div>
              </header>

              <section className="grid grid-cols-2 gap-24 relative z-10">
                 <div className="space-y-16">
                    <div className="space-y-8">
                       <h4 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-4 border-l-4 border-violet-600 pl-6">
                          01. EVENT SOURCING ARCHITECTURE
                       </h4>
                       <p className="text-[13px] text-slate-400 leading-relaxed">
                         O Botequista implementa um paradigma de <strong>Event Sourcing</strong> para persistência. Cada mutação de estado (venda, abertura, cancelamento) é tratada como um evento imutável com timestamp determinístico. Isso elimina conflitos de escrita em cenários de alta concorrência.
                       </p>
                    </div>
                    <div className="space-y-8">
                       <h4 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-4 border-l-4 border-violet-600 pl-6">
                          02. AES-256-GCM ENCRYPTION
                       </h4>
                       <p className="text-[13px] text-slate-400 leading-relaxed">
                         Segurança de nível militar (FIPS-140 compliance). Os dados financeiros são cifrados localmente antes da transmissão. A Master Key nunca toca o servidor. Privacidade absoluta: nem mesmo nós conseguimos ver o faturamento do cliente.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-12">
                    <div className="bg-violet-900/10 border-2 border-violet-500/20 p-12 rounded-[60px] space-y-10">
                       <h5 className="text-white font-black uppercase text-xs tracking-[0.4em]">KPIs de Performance</h5>
                       <div className="space-y-6">
                          {[
                            { l: "Time to Interaction", v: "< 180ms" },
                            { l: "Sync Delta Latency", v: "~320ms" },
                            { l: "Memory Footprint", v: "42MB Stable" },
                            { l: "Max Operations/sec", v: "100k (Concurrent)" }
                          ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-xs font-bold font-mono">
                               <span className="text-slate-500 uppercase">{item.l}</span>
                               <span className="text-violet-400 italic">✔ {item.v}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              {/* TECH PAGE 2: RESILIÊNCIA E IA */}
              <section className="space-y-24 border-t border-white/5 pt-32 relative z-10">
                 <div className="grid grid-cols-2 gap-24 items-center">
                    <div className="bg-slate-900 p-16 rounded-[80px] border border-white/5 space-y-8">
                       <h4 className="text-3xl font-black uppercase tracking-tighter italic">AI INTEGRATION READY</h4>
                       <p className="text-[13px] text-slate-400 leading-relaxed">
                          A estrutura de dados BTQ-JSON é compatível de forma nativa com a <strong>Gemini API</strong> da Google para análises preditivas avançadas:
                       </p>
                       <ul className="space-y-4 text-[11px] font-black uppercase text-violet-400 pl-4 border-l-2 border-violet-600">
                          <li>• Previsão de demanda baseada em séries temporais</li>
                          <li>• Detecção de anomalias em fluxos de fechamento</li>
                          <li>• Otimização automática de margem de lucro por SKU</li>
                       </ul>
                    </div>
                    <div className="space-y-12">
                       <h4 className="text-5xl font-black uppercase tracking-tighter leading-none italic">PWA & <br />Offline-First</h4>
                       <p className="text-[13px] text-slate-400 leading-relaxed">
                          Utilizamos Service Workers customizados para cacheamento agressivo de ativos e lógica de negócio. Em caso de queda de link, a operação permanece 100% funcional via IndexedDB, com sincronização automática (reconciliation) assim que a conexão é restabelecida.
                       </p>
                    </div>
                 </div>
              </section>

              <footer className="pt-20 border-t border-white/10 flex justify-between items-center relative z-10 text-xs font-bold text-slate-600 uppercase tracking-widest italic">
                 <div className="flex items-center gap-6">
                    <span className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]"></span>
                    <span>System Architecture: Verified & Stable for Enterprise Scale</span>
                 </div>
                 <div className="text-right">
                    <span>BTQ-CORE v3.1_RELEASE_PATCH_02</span>
                 </div>
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
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Manutenção</h3>
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-[310] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
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
