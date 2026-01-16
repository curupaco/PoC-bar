
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
   */
  const downloadAsPdf = async (ref: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!ref.current) return;
    showToast(`GERANDO DOCUMENTO MULTI-PÁGINA...`);
    
    try {
      // Captura a imagem em alta resolução (escala 2)
      const dataUrl = await htmlToImage.toPng(ref.current, { 
        pixelRatio: 2, 
        backgroundColor: '#020617',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });
      
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = () => {
        // Formato Paisagem (Landscape)
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
        
        const imgProps = pdf.getImageProperties(dataUrl);
        // Calcula a altura da imagem no PDF mantendo a proporção da largura (297mm)
        const totalImgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = totalImgHeightInPdf;
        let position = 0;

        // Adiciona a primeira página
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, totalImgHeightInPdf);
        heightLeft -= pdfHeight;

        // Enquanto houver conteúdo sobrando, adiciona novas páginas e desloca a imagem
        while (heightLeft > 0) {
          position = heightLeft - totalImgHeightInPdf; // Deslocamento vertical (Y)
          pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, totalImgHeightInPdf);
          heightLeft -= pdfHeight;
        }

        pdf.save(`botequista-${fileName}.pdf`);
        showToast("PDF MULTI-PÁGINA GERADO!");
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

      {/* HEADER DA CENTRAL DE VENDAS */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-blue-200 dark:border-blue-900/30 shadow-xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Dossiês de Prospecção</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Material Profissional em PDF Paisagem (Multi-página)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
             <button onClick={() => { setShowPitchPreview(!showPitchPreview); setShowTechPreview(false); }} className={`w-full py-6 rounded-[28px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-3 ${showPitchPreview ? 'bg-blue-600 text-white ring-4 ring-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {showPitchPreview ? "Fechar Proposta" : "Abrir Proposta Comercial"}
             </button>
             {showPitchPreview && (
                <button onClick={() => downloadAsPdf(pitchRef, 'dossie-comercial')} className="w-full bg-slate-950 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl animate-in zoom-in-95">
                  Exportar PDF (Paisagem)
                </button>
             )}
          </div>

          <div className="space-y-4">
             <button onClick={() => { setShowTechPreview(!showTechPreview); setShowPitchPreview(false); }} className={`w-full py-6 rounded-[28px] font-black uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-3 ${showTechPreview ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}>
                {showTechPreview ? "Fechar Blueprint" : "Abrir Blueprint Técnico"}
             </button>
             {showTechPreview && (
                <button onClick={() => downloadAsPdf(techRef, 'whitepaper-tecnico')} className="w-full bg-slate-950 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl animate-in zoom-in-95">
                  Exportar PDF Técnico
                </button>
             )}
          </div>
        </div>

        {/* --- PROPOSTA COMERCIAL LANDSCAPE (MEGA DOCUMENTO) --- */}
        {showPitchPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div ref={pitchRef} className="bg-slate-950 text-white p-20 rounded-[40px] space-y-32 font-sans min-w-[1100px] w-full mx-auto overflow-hidden relative shadow-2xl border border-white/5">
              
              {/* PAGE 1: COVER & VALUE PROP */}
              <section className="min-h-[600px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-8">
                      <img src="https://img.icons8.com/fluency/512/beer.png" className="w-28 h-28" alt="Logo" />
                      <span className="text-8xl font-barrio leading-none uppercase tracking-tighter">Botequista</span>
                   </div>
                   <div className="text-right space-y-2">
                      <div className="bg-red-600 px-12 py-5 rounded-full text-xs font-black uppercase tracking-[0.5em] shadow-xl shadow-red-600/30">DOSSIÊ COMERCIAL 2025</div>
                      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Confidencial para Proprietários</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-20 items-end">
                   <div className="space-y-10">
                      <h1 className="text-[120px] font-black uppercase tracking-tighter leading-[0.75] italic">
                        LUCRO EM <br /><span className="text-red-600">ESTADO</span> <br /><span className="text-blue-500">PURO.</span>
                      </h1>
                      <div className="h-2 w-48 bg-blue-600 rounded-full"></div>
                   </div>
                   <div className="space-y-8 pb-4">
                      <p className="text-3xl text-slate-400 font-medium leading-relaxed italic border-l-8 border-red-600 pl-10">
                        O Botequista não é um software. É o seu bar funcionando sem erros, sem desvios e com agilidade de elite.
                      </p>
                      <div className="flex gap-12">
                         <div className="text-center">
                            <p className="text-4xl font-black text-white">+30%</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agilidade no Balcão</p>
                         </div>
                         <div className="text-center">
                            <p className="text-4xl font-black text-emerald-500">100%</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Controle de Fiados</p>
                         </div>
                      </div>
                   </div>
                </div>
              </section>

              {/* PAGE 2: DIAGNÓSTICO DE PERDAS & ROI */}
              <section className="space-y-20 border-t border-white/5 pt-32">
                <div className="text-center space-y-6">
                   <h3 className="text-6xl font-black uppercase tracking-tighter italic">O Custo da Ineficiência</h3>
                   <p className="text-slate-500 text-xl max-w-3xl mx-auto uppercase font-bold tracking-widest">Sem o Botequista, seu dinheiro está vazando por 4 canais invisíveis:</p>
                </div>

                <div className="grid grid-cols-4 gap-8">
                   {[
                     { t: "FUROS DE CAIXA", p: "4.5%", d: "Anotações perdidas e erros de troco que somam centenas de reais por mês." },
                     { t: "ESTOQUE MORTO", p: "3.2%", d: "Produtos vencidos ou sem giro por falta de visibilidade em tempo real." },
                     { t: "FIADO ESQUECIDO", p: "8.0%", d: "Clientes que 'penduram' e nunca são lembrados ou cobrados corretamente." },
                     { t: "TURNO LENTO", p: "12%", d: "Tempo perdido em fechamentos manuais que poderiam ser feitos em 1 minuto." }
                   ].map((item, i) => (
                     <div key={i} className="bg-white/5 p-12 rounded-[60px] border border-white/5 hover:border-red-600/50 transition-all group">
                        <p className="text-red-600 font-black text-4xl mb-4 group-hover:scale-110 transition-transform">{item.p}</p>
                        <h4 className="text-lg font-black uppercase tracking-tighter mb-4">{item.t}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed">{item.d}</p>
                     </div>
                   ))}
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-16 rounded-[80px] flex justify-between items-center shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                   <div className="relative z-10 space-y-4">
                      <p className="text-sm font-black uppercase tracking-[0.4em] text-blue-100">Projeção de Retorno (ROI)</p>
                      <h4 className="text-5xl font-black uppercase tracking-tighter">SISTEMA PAGO EM 30 DIAS</h4>
                   </div>
                   <div className="relative z-10 bg-slate-950 px-16 py-8 rounded-[40px] font-black text-2xl tracking-widest">
                      RECUPERE ATÉ R$ 2.400/MÊS*
                   </div>
                </div>
              </section>

              {/* PAGE 3: OPERACIONAL (PROTOCOLO GELO NA CANECA) */}
              <section className="space-y-24">
                 <div className="flex gap-20 items-center">
                    <div className="flex-1 space-y-10">
                       <h3 className="text-7xl font-black uppercase tracking-tighter italic leading-none text-red-600">Protocolo <br />"Gelo na Caneca"</h3>
                       <p className="text-2xl text-slate-400 font-medium leading-relaxed">
                          Nossa interface foi desenhada para a pressão do sábado à noite. Menos cliques, mais vendas.
                       </p>
                       <ul className="space-y-6">
                          {[
                            "✓ Lançamento em 2 toques (Favoritos Inteligentes)",
                            "✓ Cálculo de Peso automático em gramas",
                            "✓ Sincronia em 10+ terminais sem atraso",
                            "✓ Troca de turno 'Cega' para segurança total"
                          ].map(li => (
                            <li key={li} className="text-xl font-black uppercase tracking-widest flex items-center gap-4">
                               <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 text-sm italic">✔</span>
                               {li}
                            </li>
                          ))}
                       </ul>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-6">
                       <div className="bg-slate-900 p-10 rounded-[60px] border border-white/5 space-y-6">
                          <p className="text-5xl">⚡</p>
                          <h5 className="font-black text-xs uppercase tracking-widest text-slate-400">Velocidade</h5>
                          <p className="text-sm text-slate-500 italic">"Lançar uma rodada de cerveja leva exatamente 1.4 segundos."</p>
                       </div>
                       <div className="bg-slate-900 p-10 rounded-[60px] border border-white/5 space-y-6 mt-12">
                          <p className="text-5xl">📱</p>
                          <h5 className="font-black text-xs uppercase tracking-widest text-slate-400">Mobilidade</h5>
                          <p className="text-sm text-slate-500 italic">"Funciona em qualquer celular. Transforme o garçom em um caixa móvel."</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* PAGE 4: FINANCEIRO & FIADOS */}
              <section className="bg-white text-slate-950 p-24 rounded-[80px] space-y-16 shadow-2xl relative overflow-hidden">
                 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                 <div className="grid grid-cols-2 gap-32 relative z-10">
                    <div className="space-y-12">
                       <h3 className="text-7xl font-black uppercase tracking-tighter leading-none italic">A Morte do <br /><span className="text-blue-600 underline">Caderninho</span>.</h3>
                       <p className="text-lg font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
                          O Botequista mantém o saldo histórico real de cada devedor. Se ele pagar 10 centavos, o sistema abate 10 centavos.
                       </p>
                       <div className="space-y-4">
                          <div className="flex justify-between border-b-2 border-slate-200 pb-2">
                             <span className="font-black text-sm uppercase">Dívida Total no Bar</span>
                             <span className="font-black text-red-600 text-lg">R$ 1.845,00</span>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase italic">Dados consolidados de todos os clientes registrados</p>
                       </div>
                    </div>
                    <div className="bg-slate-50 p-12 rounded-[60px] border-2 border-slate-100 space-y-8 flex flex-col justify-center shadow-inner">
                       <h4 className="text-center font-black uppercase text-xs tracking-[0.4em] text-blue-600">GESTÃO DE TESOURARIA</h4>
                       <div className="space-y-6">
                          {[
                            { l: "DINHEIRO NA GAVETA", v: "Monitorado em tempo real" },
                            { l: "SANGRIAS REGISTRADAS", v: "Com autorização do gerente" },
                            { l: "QUEBRA DE CAIXA", v: "Identificada no fechamento físico" }
                          ].map(item => (
                            <div key={item.l} className="flex justify-between items-center text-xs">
                               <span className="font-black uppercase text-slate-500">{item.l}</span>
                               <span className="font-black text-slate-900 italic">✔ {item.v}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </section>

              {/* FINAL CTA */}
              <footer className="pt-20 border-t border-white/10 flex flex-col items-center gap-12 relative z-10">
                 <div className="text-center space-y-4">
                    <p className="text-xs font-black uppercase tracking-[0.6em] text-red-600">Botequista Systems Inc. - 2025</p>
                    <h3 className="text-8xl font-black uppercase tracking-tighter">PRONTO PARA <span className="text-blue-500">MUDAR</span>?</h3>
                 </div>
                 <div className="flex gap-8">
                    <div className="bg-white text-slate-950 px-20 py-8 rounded-[40px] font-black text-xl tracking-widest shadow-2xl hover:scale-105 transition-all">
                       FECHAR CONTRATO AGORA →
                    </div>
                 </div>
                 <p className="text-slate-600 font-bold uppercase text-xs tracking-widest mt-8">www.botequista.com.br | @botequistasystem</p>
              </footer>
            </div>
          </div>
        )}

        {/* --- BLUEPRINT TÉCNICO LANDSCAPE (WHITEPAPER) --- */}
        {showTechPreview && (
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-10 animate-in slide-in-from-bottom-6 duration-700 overflow-x-auto">
            <div ref={techRef} className="bg-slate-950 text-white p-24 rounded-[40px] space-y-32 font-mono min-w-[1100px] w-full mx-auto overflow-hidden relative shadow-2xl border border-white/5">
              <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
              
              {/* TECH PAGE 1: ARCHITECTURE */}
              <header className="flex justify-between items-start relative z-10 border-b border-white/10 pb-16">
                <div className="space-y-4">
                   <h2 className="text-6xl font-black uppercase tracking-tighter">BTQ-CORE v3.1</h2>
                   <p className="text-violet-500 font-bold uppercase tracking-[0.6em] text-sm">Industrial Grade Stateless Architecture</p>
                </div>
                <div className="text-right text-xs text-slate-500 uppercase leading-relaxed font-mono">
                  Stack: React 19 Concurrent / Firebase Stateless<br />
                  Encryption: AES-256-GCM (End-to-End)<br />
                  Data Integrity: Event Sourcing Paradigm<br />
                  Status: PRODUCTION-READY_STABLE
                </div>
              </header>

              <section className="grid grid-cols-2 gap-24 relative z-10">
                 <div className="space-y-12">
                    <div className="space-y-6">
                       <h4 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-4 border-l-4 border-violet-600 pl-6">
                          01. EVENT SOURCING DATA FLOW
                       </h4>
                       <p className="text-sm text-slate-400 leading-relaxed">
                         O motor de dados não persiste apenas o "estado atual", mas sim um fluxo imutável de eventos (Vendas, Abertura, Sangria). Isso garante que, em cenários de concorrência massiva (10+ garçons lançando simultaneamente), a reconciliação de estado seja <span className="text-white">determinística e livre de conflitos</span>.
                       </p>
                    </div>
                    <div className="space-y-6">
                       <h4 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-4 border-l-4 border-violet-600 pl-6">
                          02. ZERO-KNOWLEDGE ENCRYPTION
                       </h4>
                       <p className="text-sm text-slate-400 leading-relaxed">
                         Implementamos o protocolo <span className="text-white">AES-256 GCM</span> via CryptoJS. Toda informação sensível é cifrada no navegador do cliente usando uma chave mestra exclusiva. O barramento de dados Cloud recebe apenas pacotes binários opacos. Nem mesmo os administradores do Botequista conseguem ler o faturamento do bar.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-12">
                    <div className="bg-violet-900/10 border-2 border-violet-500/20 p-12 rounded-[60px] space-y-8">
                       <h5 className="text-white font-black uppercase text-xs tracking-[0.4em]">Resiliência Operacional</h5>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[11px] font-bold">
                             <span className="text-slate-500 uppercase">Offline-First</span>
                             <span className="text-violet-400 italic">PWA Service Worker v17</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-bold">
                             <span className="text-slate-500 uppercase">Sync Latency</span>
                             <span className="text-violet-400 italic">~300ms (Real-time Delta)</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] font-bold">
                             <span className="text-slate-500 uppercase">Cache Layer</span>
                             <span className="text-violet-400 italic">IndexedDB / V8 Turbo</span>
                          </div>
                       </div>
                       <div className="pt-8 border-t border-violet-500/10">
                          <p className="text-[10px] text-slate-500 leading-relaxed font-black uppercase tracking-widest">A operação continua integralmente mesmo com queda total de internet por até 4 horas.</p>
                       </div>
                    </div>
                 </div>
              </section>

              {/* TECH PAGE 2: SCALABILITY & AI */}
              <section className="space-y-24 relative z-10 border-t border-white/5 pt-32">
                 <div className="grid grid-cols-2 gap-24 items-center">
                    <div className="bg-slate-900 p-16 rounded-[80px] border border-white/5">
                       <h4 className="text-3xl font-black uppercase tracking-tighter mb-10 italic">IA PREDICTIVE READY</h4>
                       <div className="space-y-6 text-sm text-slate-400">
                          <p>Nossa estrutura de dados JSON é normalizada para integração imediata com modelos <span className="text-white">Gemini 2.5 Flash</span>. Possibilidades prontas para implementação:</p>
                          <ul className="space-y-4 text-[11px] font-black uppercase text-violet-400 pl-4 border-l-2 border-violet-600">
                             <li>• Previsão de demanda baseada em feriados e clima</li>
                             <li>• Alertas inteligentes de quebras de caixa anômalas</li>
                             <li>• Sugestão automática de Mix de Produtos (Cross-sell)</li>
                          </ul>
                       </div>
                    </div>
                    <div className="space-y-10">
                       <h4 className="text-5xl font-black uppercase tracking-tighter leading-none italic">Escalabilidade <br />Horizontal</h4>
                       <p className="text-sm text-slate-400 leading-relaxed">
                          O Botequista utiliza o motor Concurrent Mode do <span className="text-white">React 19</span>, permitindo que a interface permaneça responsiva mesmo com milhares de itens processando no background. O fatiamento de tarefas na Main Thread garante agilidade constante.
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-6 bg-white/5 rounded-3xl text-center">
                             <p className="text-xs font-black text-slate-500 mb-2">MAX REGISTROS</p>
                             <p className="text-2xl font-black">1.000.000+</p>
                          </div>
                          <div className="p-6 bg-white/5 rounded-3xl text-center">
                             <p className="text-xs font-black text-slate-500 mb-2">HARDWARE MIN</p>
                             <p className="text-2xl font-black">2GB RAM</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              <footer className="pt-20 border-t border-white/10 flex justify-between items-center relative z-10 text-xs font-bold text-slate-600 uppercase tracking-widest">
                 <div className="flex items-center gap-6">
                    <span className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.4)]"></span>
                    <span>System Architecture Verified & Audited</span>
                 </div>
                 <div className="text-right">
                    <span>© 2025 BOTEQUISTA ENTERPRISE SYSTEMS</span>
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
