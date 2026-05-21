import React, { useState, useEffect, useRef } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20o%20site%20do%20Botequista%20e%20quero%20testar%20gratuitamente%20no%20meu%20bar.";
const whatsAppLinkDemo = "https://wa.me/5511966989160?text=Quero%20agendar%20uma%20demonstração%20do%20Botequista%20para%20o%20meu%20bar.";

// ─── Animated Counter ───
const AnimatedCounter: React.FC<{ target: number; suffix?: string; prefix?: string; duration?: number }> = ({ target, suffix = '', prefix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const step = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{prefix}{count.toLocaleString('pt-BR')}{suffix}</div>;
};

// ─── Scroll Reveal Hook ───
const useScrollReveal = () => {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

// ─── Browser Frame ───
const BrowserFrame: React.FC<{ src: string; alt: string; label?: string }> = ({ src, alt, label }) => (
  <div className="relative group w-full max-w-full mx-auto scroll-reveal">
    {label && (
      <div className="absolute -top-8 left-4 flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">{label}</span>
      </div>
    )}
    <div className="rounded-2xl bg-slate-800/80 p-1.5 shadow-2xl shadow-black/40 border border-white/5 overflow-hidden w-full backdrop-blur-sm">
      <div className="bg-slate-900 h-7 flex items-center px-4 gap-2 rounded-t-xl">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500/40"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/40"></div>
        </div>
        <div className="flex-1 max-w-[140px] mx-auto bg-slate-950/50 h-4 rounded-full border border-white/5 flex items-center px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 mr-2"></div>
          <span className="text-[7px] font-mono text-slate-400 truncate">botequista.app</span>
        </div>
      </div>
      <div className="relative aspect-video overflow-hidden">
        <img src={src} alt={alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent pointer-events-none"></div>
      </div>
    </div>
  </div>
);

// ─── Feature Card ───
const FeatureCard: React.FC<{ icon: string; title: string; desc: string; accent?: string }> = ({ icon, title, desc, accent = 'red' }) => {
  const isRed = accent === 'red';
  return (
    <div className={`scroll-reveal group p-8 rounded-3xl bg-slate-900/40 border border-white/5 ${isRed ? 'hover:border-red-500/30 hover:shadow-red-900/10' : 'hover:border-emerald-500/30 hover:shadow-emerald-900/10'} transition-all duration-500 hover:-translate-y-1 hover:shadow-xl`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform ${isRed ? 'bg-red-600/10' : 'bg-emerald-600/10'}`}>
        {icon}
      </div>
      <h3 className="text-white font-black text-sm uppercase tracking-wide mb-3">{title}</h3>
      <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};

// ─── Screenshot Gallery with Tabs ───
const screenshots = [
  { src: '/landing_assets/assets/pos_real.png', label: 'Tela de Vendas', desc: 'Seus produtos favoritos no topo, busca instantânea e a comanda atualizada em tempo real' },
  { src: '/landing_assets/assets/dashboard_real.png', label: 'Suas Mesas', desc: 'Cada mesa com sua cor: verde tá bebendo, amarelo tá demorando, vermelho cuidado' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-28-56.png', label: 'Fechamento', desc: 'Dinheiro, Pix, Cartão ou fiado tudo junto na mesma tela' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-29-40.png', label: 'Conferência Cega', desc: 'O garçom conta o dinheiro sem ver quanto deveria ter. Você descobre a verdade.' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-06.png', label: 'Caixa', desc: 'Sangria, suprimento e controle do cofre. Como um caixa eletrônico, só digita e confirma.' },
  { src: '/landing_assets/assets/reports_real.png', label: 'Relatórios', desc: 'Sete tipos de relatório: financeiro, produtos, equipe, tudo organizado por turno' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-54.png', label: 'Equipe', desc: 'Cada funcinário com seu nível de acesso: quem pode cancelar, quem pode fechar o caixa' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-32-39.png', label: 'Auditoria', desc: 'Um log que mostra quem fez o quê, quando. Se algo estranho acontecer, você rastreia.' },
  { src: '/landing_assets/assets/dashboard_real.png', label: 'Cozinha', desc: 'Fila de pedidos touch-screen para os cozinheiros, totalmente integrada com alarmes sonoros em tempo real.' },
];

const ScreenshotGallery: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % screenshots.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scroll-reveal">
      <div className="max-w-5xl mx-auto">
        <BrowserFrame src={screenshots[active].src} alt={screenshots[active].label} label={screenshots[active].label} />
        <p className="text-center text-slate-300 text-sm mt-6 font-medium">{screenshots[active].desc}</p>
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {screenshots.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                i === active
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              {s.label.split('·')[0].trim()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


const ROICalculator: React.FC = () => {
  const [revenue, setRevenue] = useState(30000);
  const [leakage, setLeakage] = useState(5); // % de perda estimada

  const monthlySavings = (revenue * (leakage / 100));
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="scroll-reveal p-8 md:p-12 rounded-[40px] bg-slate-900/50 border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2 block">Simulador de Impacto</span>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">Quanto seu bar está <span className="text-red-500 italic">perdendo</span> hoje?</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Pequenos erros de caixa, comandas esquecidas e fiados não pagos parecem pouco, mas no fim do ano viram um rombo.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Faturamento Mensal</label>
                <span className="text-lg font-black text-white">R$ {revenue.toLocaleString('pt-BR')}</span>
              </div>
              <input 
                type="range" min="5000" max="200000" step="1000" 
                value={revenue} onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Estimativa de Perda (Erro/Fuga)</label>
                <span className="text-lg font-black text-red-500">{leakage}%</span>
              </div>
              <input 
                type="range" min="1" max="15" step="1" 
                value={leakage} onChange={(e) => setLeakage(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest italic text-right">*Média do mercado: 4% a 8%</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/50 p-10 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center relative">
          <div className="absolute -top-4 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">Economia Potencial</div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Você deixaria de perder</div>
          <div className="text-5xl md:text-6xl font-black text-emerald-500 tracking-tighter mb-2">R$ {monthlySavings.toLocaleString('pt-BR')}</div>
          <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">por mês</div>
          
          <div className="mt-8 pt-8 border-t border-white/5 w-full">
            <div className="text-3xl font-black text-white tracking-tighter mb-1">R$ {yearlySavings.toLocaleString('pt-BR')}</div>
            <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">por ano no seu bolso</div>
          </div>
        </div>
      </div>
    </div>
  );
};


const Typewriter: React.FC<{ text: string; delay?: number }> = ({ text, delay = 5 }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);
  return <>{currentText}</>;
};

const WhatsAppSimulation: React.FC = () => (
  <div className="scroll-reveal max-w-md mx-auto bg-[#075e54]/5 rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-b from-[#25d366]/5 to-transparent pointer-events-none"></div>
    
    {/* WhatsApp Header Mockup */}
    <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
      <div className="w-12 h-12 rounded-full bg-[#25d366] flex items-center justify-center text-white text-xl shadow-lg shadow-[#25d366]/20">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </div>
      <div>
        <div className="text-xs font-black uppercase text-white tracking-widest">Seu Bar no WhatsApp</div>
        <div className="text-[9px] text-[#25d366] font-bold uppercase tracking-widest flex items-center gap-1.5">
          Relatório de Turno
        </div>
      </div>
    </div>

    {/* Messages */}
    <div className="space-y-6">
      <div className="bg-[#1f2c34] p-5 rounded-2xl rounded-tl-none border border-white/5 max-w-[90%] shadow-xl relative group-hover:scale-[1.02] transition-transform">
        <p className="text-sm text-slate-200 leading-relaxed font-mono">
          *📊 RESUMO DE TURNO* <br/><br/>
          📅 *Data:* 02/05/2026 <br/>
          👤 *Operador:* Galego <br/>
          ⏰ *Fechamento:* 22:45 <br/><br/>
          💰 *Faturamento:* R$ 4.280,00 <br/>
          🎫 *Tickets:* 42 <br/>
          📈 *Ticket Médio:* R$ 101,90 <br/><br/>
          _Gerado via Botequista System_
        </p>
        <span className="text-[9px] text-slate-500 block mt-2 text-right">22:45</span>
      </div>

      <div className="bg-[#054740] p-5 rounded-2xl rounded-tr-none border border-[#25d366]/20 max-w-[90%] ml-auto shadow-xl relative group-hover:scale-[1.02] transition-transform">
        <p className="text-sm text-white leading-relaxed font-bold italic">
          "Recebido! O faturamento hoje superou a meta."
        </p>
        <div className="flex justify-end items-center gap-1 mt-2">
          <span className="text-[9px] text-slate-400">22:47</span>
          <span className="text-[#34b7f1]">✓✓</span>
        </div>
      </div>
    </div>

    <div className="mt-8 text-center">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Exemplo de Compartilhamento via WhatsApp</span>
    </div>
  </div>
);

// ─── MAIN COMPONENT ───
export const LandingPage2: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [nerdTab, setNerdTab] = useState<'stack' | 'sync' | 'perf'>('stack');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

  const faqs = [
    { q: 'É grátis mesmo?', a: 'Sim. Zero mensalidade. Zero contrato. Zero cartão. Enquanto você for parceiro fundador, é de graça pra sempre.' },
    { q: 'Funciona offline?', a: 'Sim. Vende sem internet. Os dados ficam no dispositivo e sincronizam quando a conexão voltar via SyncQueue.' },
    { q: 'Quanto tempo pra começar?', a: '15 minutos. Você cadastra o cardápio e já pode vender. Sem ajuda técnica necessária.' },
    { q: 'Onde meus dados ficam?', a: 'Ficam no seu navegador (IndexedDB) e na nuvem Google (Firebase). Você também pode exportar para o GitHub.' },
    { q: 'Precisa baixar aplicativo?', a: 'Não. É um PWA. Funciona direto no navegador do celular ou PC, mas você pode "Instalar" na tela inicial.' },
    { q: 'Posso usar em mais de um celular?', a: 'Sim. O sistema sincroniza múltiplas telas em tempo real. O garçom lança, o caixa vê.' },
    { q: 'E se o celular quebrar?', a: 'Seus dados estão na nuvem. Basta logar em outro aparelho e tudo volta instantaneamente.' },
    { q: 'Tem suporte?', a: 'Sim, suporte prioritário via WhatsApp para todos os bares parceiros.' },
  ];

  const filteredFAQs = faqs.filter(f => 
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  useScrollReveal();

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* ─── CSS ─── */}
      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-gradient {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(185, 28, 28, 0.15), transparent),
                      radial-gradient(ellipse 60% 40% at 80% 110%, rgba(16, 185, 129, 0.08), transparent);
        }
        .cta-glow {
          box-shadow: 0 0 60px rgba(37, 211, 102, 0.2), 0 0 120px rgba(37, 211, 102, 0.05);
        }
        .cta-glow:hover {
          box-shadow: 0 0 80px rgba(37, 211, 102, 0.35), 0 0 160px rgba(37, 211, 102, 0.1);
        }
        .float-anim {
          animation: gentleFloat 6s ease-in-out infinite;
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .pulse-border {
          animation: pulseBorder 2s ease-in-out infinite;
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(185, 28, 28, 0.2); }
          50% { border-color: rgba(185, 28, 28, 0.5); }
        }
        .shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .scanline {
          width: 100%;
          height: 100%;
          z-index: 10;
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.1) 51%);
          background-size: 100% 4px;
          pointer-events: none;
          position: absolute;
          top: 0;
          left: 0;
          opacity: 0.2;
        }
        .terminal-cursor {
          display: inline-block;
          width: 8px;
          height: 1.2em;
          background: #10b981;
          margin-left: 4px;
          animation: blink 1s infinite;
          vertical-align: middle;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-[#020617]/85 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-barrio text-xl shadow-lg shadow-red-600/20">B</div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase font-barrio leading-none">Botequista</span>
              <span className="text-[7px] font-black tracking-[0.4em] uppercase text-red-500 italic">Simplicidade & Inteligência de Balcão</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <button onClick={() => scrollToSection('problema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">O Problema</button>
            <button onClick={() => scrollToSection('solucao')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Solução</button>
            <button onClick={() => scrollToSection('sistema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Sistema</button>
            <button onClick={() => scrollToSection('preco')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Preço</button>
            <button onClick={() => setIsNerdModalOpen(true)} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">🤓 Tech</button>
            <a href="/?demo=true" className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Ver Demo</a>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="bg-[#16a34a] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-900/30">
              WhatsApp
            </a>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white p-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
          </button>
        </div>
        {/* Mobile Menu */}
        <div className={`fixed inset-0 z-50 lg:hidden bg-[#020617]/98 backdrop-blur-2xl transition-all duration-500 ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
            <button onClick={() => scrollToSection('problema')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">O Problema</button>
            <button onClick={() => scrollToSection('solucao')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Solução</button>
            <button onClick={() => scrollToSection('sistema')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Sistema</button>
            <button onClick={() => scrollToSection('preco')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Preço</button>
            <button onClick={() => { setIsNerdModalOpen(true); setIsMenuOpen(false); }} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">🤓 Tech</button>
            <a href="/?demo=true" onClick={() => setIsMenuOpen(false)} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Ver Demo</a>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full max-w-xs bg-[#16a34a] text-white px-8 py-4 rounded-2xl text-center text-lg font-black uppercase tracking-tight shadow-xl">
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </nav>

      <main>
      {/* ─── HERO ─── */}
      <section className="hero-gradient relative pt-16 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 scroll-reveal animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                       Programa parceiro: Primeiros 10 bares GRÁTIS
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8 uppercase scroll-reveal">
            <span className="text-gradient block">Tão simples quanto seu</span>
            <span className="text-emerald-500 block italic">caderninho</span>
            <span className="text-gradient block">tão inteligente quanto você precisa</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-10 leading-relaxed font-medium max-w-3xl mx-auto scroll-reveal">
            Abandone a calculadora e o papel. O Botequista traz a <span className="text-white font-bold">clareza total</span> do seu lucro e a <span className="text-emerald-400 font-bold">paz de espírito</span> no fechamento do caixa. Tudo <span className="text-white font-bold">grátis</span>, offline e direto no seu celular.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-16 scroll-reveal">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow flex items-center gap-3 bg-[#16a34a] text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 shadow-2xl">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Falar no WhatsApp
            </a>
            <a href="/?demo=true" className="px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-tight transition-all bg-slate-900 border border-white/10 hover:border-white/20 hover:bg-slate-800 text-white shadow-xl">
              Testar Demo Agora
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 mb-16 scroll-reveal">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-black text-xs">3</div>
              <span className="text-xs">bares usando agora</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              <span className="text-xs">Nota 4.9/5.0</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span className="text-xs">Funciona offline</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto scroll-reveal">
            <BrowserFrame
              src="/landing_assets/assets/dashboard_real.png"
              alt="Painel de Vendas Real do Botequista"
              label="Sistema em Produção"
            />
          </div>
        </div>
      </section>

      {/* ─── WHATSAPP REPORTS ─── */}
      <section className="py-24 px-6 bg-[#020617] relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <WhatsAppSimulation />
            </div>
            <div className="order-1 lg:order-2 space-y-8 scroll-reveal">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Gestão Prática</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
                Relatórios Prontos para <span className="text-emerald-500 italic">Compartilhar</span>.
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Ao fechar o turno, o Botequista gera um resumo formatado que você pode compartilhar com sócios ou gerentes via WhatsApp com um clique. Tenha os números do dia sempre à mão, sem complicação.
              </p>
              <div className="space-y-4">
                {[
                  'Resumo de turno formatado',
                  'Compartilhamento via link WhatsApp',
                  'Conferência de caixa simplificada',
                  'Sem necessidade de integrações pagas'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ─── THE PROBLEM ─── */}
      <section id="problema" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.9] uppercase">
              O sistema que não te deixa na mão e o caixa que finalmente <span className="text-red-500 italic">bate</span>.
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { text: 'Caixa nunca fecha certo. Sempre falta ou sobra dinheiro.' },
              { text: 'Internet cai = bar fecha. Perde venda na sexta-feira.' },
              { text: 'Fiado vira dívida. Cliente some sem pagar.' },
              { text: 'Não sabe quem vendeu o quê. Funcionários sem métricas?' },
            ].map((p, i) => (
              <div key={i} className="scroll-reveal flex items-center gap-4 p-5 rounded-2xl bg-red-950/10 border border-red-900/20">
                <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                <span className="text-slate-200 text-sm">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE SOLUTION ─── */}
      <section id="solucao" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">A Solução Definitiva</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              O sistema que <span className="text-emerald-500 italic">nunca para</span>.
            </h2>
            <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto">Projetado para o bar da vida real com internet instável, sexta-feira lotada e clientes exigentes e apressados</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="📶" title="Funciona Sem Internet" desc="Cada venda fica salva no celular na hora. Quando a internet voltar, o sistema sincroniza sozinho. Seu bar não para." accent="emerald" />
            <FeatureCard icon="⚡" title="Venda em 3 Cliques" desc="Você coloca o produto, o cliente paga, pronto. Os favoritos ficam no topo e a interface é otimizada para velocidade." accent="emerald" />
             <FeatureCard icon="🕵️" title="Conferência Cega" desc="O garçom conta o dinheiro sem ver o valor do sistema. Não tem como 'bater o caixa' na sorte ou na má fé." accent="emerald" />
            <FeatureCard icon="🛡️" title="Segurança de Dados" desc="Backup fácil e regras de segurança que garantem que seus dados de faturamento e estoque estejam sempre protegidos." accent="emerald" />
            <FeatureCard icon="📱" title="Interface Adaptativa" desc="Funciona perfeitamente em celulares, tablets ou computadores. Layout otimizado para telas pequenas no balcão." accent="emerald" />
            <FeatureCard icon="🚨" title="Velocidade de Estoque" desc="O sistema calcula a velocidade de venda e avisa se um produto corre risco de acabar nas próximas horas." accent="emerald" />
            <FeatureCard icon="📊" title="Lista de Compras" desc="Gere sua lista de reposição baseada no giro real dos últimos 7 dias e compartilhe pelo WhatsApp em um clique." accent="emerald" />
            <FeatureCard icon="⏰" title="Detector de Mesa Travada" desc="O sistema identifica mesas ociosas e alerta o garçom para oferecer uma nova rodada, otimizando o giro do seu bar." accent="emerald" />
            <FeatureCard icon="🍳" title="Monitor de Cozinha" desc="Fila touch reativa para cozinheiros com som de campainha sincronizado em tempo real nos aparelhos dos garçons." accent="emerald" />
          </div>

          {/* Highlight: Offline */}
          <div className="mt-20 p-10 md:p-16 rounded-[40px] bg-emerald-950/20 border border-emerald-900/30 scroll-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4">Exclusividade Botequista</div>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                  A internet pode<span className="text-emerald-500"> cair</span>.
                </h3>
                <p className="text-slate-200 text-lg leading-relaxed mb-8">
                  O Botequista salva os dados primeiro no celular do garçom, e depois na nuvem. Se a internet cair, a venda continua. Quando voltar, tudo se sincroniza. Sem precisar de TI, sem dor de cabeça.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Funciona Offline', 'Sincroniza Sozinho', 'Dados Protegidos', 'Sem Servidor'].map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center gap-4 p-10 rounded-3xl bg-slate-950/50 border border-emerald-500/10">
                  <div className="text-6xl float-anim">📶</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Disponibilidade</div>
                  <div className="text-7xl font-black text-white"><AnimatedCounter target={99} suffix="%" /></div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Mesmo sem internet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HIGHLIGHT: RELIABILITY ─── */}
      <section className="py-24 px-6 bg-[#020617] relative">
        <div className="max-w-6xl mx-auto">
          <div className="p-12 rounded-[40px] bg-slate-900/30 border border-white/5 flex flex-col items-center text-center scroll-reveal">
            <div className="w-20 h-20 rounded-3xl bg-red-600/10 flex items-center justify-center text-4xl mb-8 animate-pulse">🎯</div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">Foco total no <span className="text-red-500 italic">Caderninho</span></h3>
            <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
              O Botequista não foi feito para competir com sistemas gigantes e caros. Foi feito para você que hoje usa o papel, a caneta ou a memória e precisa de organização sem burocracia.
            </p>
          </div>
        </div>
      </section>

      {/* ─── REAL SCREENSHOTS ─── */}
      <section id="sistema" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block">Veja com seus olhos</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Zero Photoshop. <span className="text-red-600 italic">Tudo Real.</span>
            </h2>
            <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto">Capturas de tela reais do sistema em produção. O Botequista é exatamente assim sem filtro, sem photoshop.</p>
          </div>

          <ScreenshotGallery />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block">3 passos simples</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Funciona em <span className="text-emerald-500">15 minutos</span></h2>
          </div>

          <div className="space-y-0">
            {[
              { step: '01', title: 'Fale conosco pelo WhatsApp', desc: 'Criamos sua conta gratuitamente e configuramos sua primeira unidade.', icon: '💬' },
              { step: '02', title: 'Cadastre seu cardápio', desc: 'Interface intuitiva com categorias, adicionais e preços. 15 minutos e já está vendendo.', icon: '📋' },
              { step: '03', title: 'Comece a faturar com controle', desc: 'PDV pronto. Relatórios ativos. Conferência cega desde o primeiro dia.', icon: '🚀' },
            ].map((s, i) => (
              <div key={i} className="scroll-reveal flex gap-8 items-start group py-10 border-b border-white/5 last:border-0">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:border-red-500/30 transition-all">
                    {s.icon}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">Passo {s.step}</div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">{s.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ─── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block">Nada escondido</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Tudo isso <span className="text-red-600">incluído</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 scroll-reveal">
            {[
              'Tela de vendas com modo rápido',
              'Gestão de mesas e comandas',
              'Cardápio com categorias e adicionais',
              'Detector de Mesa Travada (Premium)',
              'Contador de Tempo de Mesa',
              'Ticket Médio com Tendência',
              'Caixa: sangria e suprimento',
              'Conferência cega de fechamento',
              '7 tipos de relatório',
              'Controle de acesso por funcionário',
              'Gestão de fiado (pendura)',
              'Suporte a várias lojas',
              'Log de auditoria',
              'Backup automático',
              'Modo noturno (tela escura)',
              'Recibo via WhatsApp',
              'Curva ABC de produtos',
              'Análise de Giro de Estoque',
              'Reposição Inteligente (WhatsApp)',
              'Mapa de horário de pico',
              'Modo Evento / Festas (Novo)',
              'Happy Hour Automático (Novo)',
              'Radar de Prejuízo (Margem < 30%) (v4.9.0)',
              'Smart Stock Híbrido & Hot Items (v4.9.0)',
              'Régua de Cobrança Educada (Pendura) (v4.9.0)',
              'Monitor de Cozinha Touch Sincronizado (v4.9.5)',
              'Campainha de Balcão & Toasts Reativos (v4.9.5)',
              'Travas de Segurança para Contas Fechadas (v4.9.5)',
              'Validação Anti-Erro (v4.7.3)',
              'Confirmação Segura (v4.7.2)',
              'Admin & Logout Guard (v4.7.3)',
              'Interface Mobile XS (v4.7.1)',
              'Funciona no celular, tablet ou PC',
              'Funciona sem internet',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-5 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BUSINESS INTELLIGENCE SECTION ─── */}
      <section className="py-32 px-6 bg-emerald-600/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Gestão Ativa</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Sua <span className="text-white italic">Consultoria de Bolso</span></h2>
            <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto">Módulos inteligentes que não apenas registram vendas, mas mostram como aumentar seu lucro real todo dia.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Lucro Real & CMV', desc: 'Saiba exatamente quanto ganha em cada item descontando o custo real da mercadoria cadastrado por você.', icon: '💰', tag: 'FINANCEIRO' },
              { title: 'Taxa de Serviço (10%)', desc: 'Ative a gratificação opcional no PDV. O sistema calcula e separa o valor automaticamente para evitar confusão no fim do turno.', icon: '🤝', tag: 'EQUIPE' },
              { title: 'Detector de Mesa Travada', desc: 'O sistema avisa quais mesas estão ocupando espaço sem consumir. Sugestão visual de saideira para aumentar o giro.', icon: '⏰', tag: 'OPERACIONAL' },
              { title: 'Radar de Prejuízo', desc: 'Cruza custos e vendas, alertando se a margem de algum item de alto giro cair abaixo de 30% para você precificar melhor.', icon: '📈', tag: 'INTELIGÊNCIA' },
              { title: 'Smart Stock Híbrido', desc: 'Estoque crítico estimado em horas de consumo para itens controlados, e alertas de Alta Demanda (Hot Items) para produtos comuns.', icon: '⏳', tag: 'ESTOQUE' },
              { title: 'Cardápio Digital QR', desc: 'Gere um link para os clientes visualizarem seu menu atualizado direto no celular, sem baixar nada.', icon: '📱', tag: 'ATENDIMENTO' },
              { title: 'Blindagem Anti-Fraude', desc: 'Proteção visual e funcional da conta mestre. Log de auditoria que registra cada fechamento de caixa.', icon: '🛡️', tag: 'SEGURANÇA' },
              { title: 'Gestão de Fiado (Pendura)', desc: 'Histórico de consumo de cada cliente. Régua de cobrança educada para reaver valores pendentes com organização.', icon: '📋', tag: 'GESTÃO' },
            ].map((f, i) => (
              <div key={i} className="scroll-reveal p-10 rounded-[40px] bg-slate-900/50 border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-4xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">{f.icon}</div>
                <div className="text-[8px] font-black text-emerald-500 mb-4 tracking-[0.3em] uppercase">{f.tag}</div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QR CODE MENU SECTION ─── */}
      <section className="py-32 px-6 relative overflow-hidden bg-slate-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 scroll-reveal">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Experiência do Cliente</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
                Cardápio Digital <span className="text-emerald-500 italic">Sincronizado</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Chega de cliente pedindo o que não tem. Com o Sincronismo Atômico do Botequista, se o estoque acaba no seu PDV, o item some do celular do cliente na mesma hora.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all">
                  <h4 className="font-black uppercase text-[10px] text-emerald-500 mb-2">Zero Frustração</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">O cardápio reflete a realidade do balcão em milissegundos. Evite o "Ih, acabou" na frente do cliente.</p>
                </div>
                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all">
                  <h4 className="font-black uppercase text-[10px] text-emerald-500 mb-2">Auto-Gerenciável</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">Atualize preços e fotos no sistema e veja mudar na mesa do cliente instantaneamente.</p>
                </div>
              </div>
            </div>
            <div className="relative group scroll-reveal">
              <div className="absolute -inset-10 bg-emerald-500/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <div className="relative bg-slate-900 p-4 rounded-[60px] border border-white/10 shadow-2xl max-w-[280px] mx-auto transform -rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <div className="bg-slate-950 rounded-[50px] aspect-[9/19] overflow-hidden border border-white/10 relative">
                  <img src="/landing_assets/assets/Screenshot_2026-03-03_21-32-14.png" alt="Cardápio Digital" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-10 left-0 right-0 text-center">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Menu Digital</div>
                    <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-[0.3em]">Live Sync</div>
                  </div>
                </div>
                <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500 rounded-full flex flex-col items-center justify-center text-white text-center shadow-2xl shadow-emerald-500/20 rotate-12 group-hover:rotate-0 transition-all duration-700">
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-[8px] font-black uppercase leading-tight">Teste no<br/>Celular</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Botequista vs. <span className="text-red-600 italic">Resto do Mercado</span></h2>
          </div>
          <div className="scroll-reveal bg-slate-950/80 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-3 py-5 bg-white/5 px-6 font-black uppercase text-[11px] tracking-wider border-b border-white/10">
              <div className="text-slate-200">Funcionalidade</div>
              <div className="text-center text-emerald-500">Botequista</div>
              <div className="text-center text-slate-400">Outros</div>
            </div>
            {[
              { f: 'Venda Offline (PWA)', b: true, t: false },
              { f: 'Conferência Cega de Caixa', b: true, t: false },
              { f: 'Detector de Mesa Travada', b: true, t: false },
              { f: 'Relatório via WhatsApp', b: true, t: true },
              { f: 'Gestão de Fiado Integrada', b: true, t: true },
              { f: 'Análise de Giro de Estoque', b: true, t: false },
              { f: 'Ticket Médio com Tendência', b: true, t: false },
              { f: 'Curva ABC por Lucro', b: true, t: false },
              { f: 'Funciona em Qualquer Aparelho', b: true, t: false },
              { f: 'Engenharia de Lucro Real (CMV)', b: true, t: false },
              { f: 'Taxa de Serviço Automática', b: true, t: false },
              { f: 'Happy Hour Automático', b: true, t: false },
              { f: 'Modo Evento (Venda Expressa)', b: true, t: false },
              { f: 'Cardápio Digital QR Sync', b: true, t: false },
              { f: 'Radar de Prejuízo (CMV/Giro)', b: true, t: false },
              { f: 'Smart Stock Híbrido & Hot Items', b: true, t: false },
              { f: 'Régua de Cobrança (Pendura)', b: true, t: false },
              { f: 'Monitor de Cozinha Reativo (Ding! 🛎️)', b: true, t: false },
              { f: 'Grátis', b: true, t: false },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 py-4 border-b border-white/5 items-center px-6 hover:bg-white/[0.02] transition-colors text-sm">
                <div className="text-slate-200 font-semibold text-xs">{row.f}</div>
                <div className="text-center">{row.b ? <span className="text-emerald-500 font-black">✓</span> : <span className="text-red-500">✗</span>}</div>
                <div className="text-center opacity-40">{row.t ? <span className="text-emerald-500 font-black">✓</span> : <span className="text-red-500">✗</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block">Quem já usa, aprova</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Depoimentos <span className="text-red-600 italic">Reais</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Ricardo', bar: 'Bar do Galego', quote: 'Antes eu perdia R$200 por semana em caixa furado. Depois da conferência cega, o caixa bate 100% dos dias. É impressionante.', role: 'Proprietário', stars: 5, color: 'from-amber-500/10', img: '/landing_assets/testimonials/ricardo.png' },
              { name: 'Mariana', bar: 'Sunset Lounge', quote: 'A Curva ABC me mostrou que eu estava perdendo margem com uma cerveja que eu achava que era a melhor. Mudei o cardápio e meu lucro subiu 18%.', role: 'Gerente', stars: 5, color: 'from-indigo-500/10', img: '/landing_assets/testimonials/mariana.png' },
              { name: 'Ozzy', bar: 'Botequim Gourmet', quote: 'Gerencio minhas 3 unidades de casa. O sistema funciona até quando meu garçom deixa o tablet sem Wi-Fi. Paz de espírito total.', role: 'Franqueador', stars: 5, color: 'from-emerald-500/10', img: '/landing_assets/testimonials/ozzy.png' },
              { name: 'Cláudio', bar: 'Espeto Real', quote: 'O Smart Stock me avisou que o carvão ia acabar num feriado. Comprei antes e não perdi o giro. Esse sistema se paga sozinho.', role: 'Dono', stars: 5, color: 'from-red-500/10', img: '/landing_assets/testimonials/claudio.png' },
              { name: 'Ana', bar: 'Vila Madalena House', quote: 'O relatório de equipe acabou com as discussões sobre a caixinha. Tudo automático e transparente. Meus garçons amam.', role: 'Gerente', stars: 5, color: 'from-blue-500/10', img: '/landing_assets/testimonials/ana.png' },
            ].map((t, i) => (
              <div key={i} className={`scroll-reveal p-10 rounded-[40px] bg-gradient-to-br ${t.color} to-transparent border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-8 text-6xl opacity-[0.03] group-hover:opacity-[0.07] transition-all">"</div>
                <div className="flex gap-1 mb-8">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="text-slate-200 text-base leading-relaxed mb-10 font-medium italic relative z-10">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div>
                    <div className="text-white font-black text-sm uppercase tracking-tight">{t.name}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.role} • {t.bar}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ─── */}
      <section className="py-24 px-6 bg-slate-950/50">
        <div className="max-w-6xl mx-auto">
          <ROICalculator />
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="preco" className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4 block">Preço Transparente</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
              É <span className="text-emerald-500">Grátis</span> De Verdade
            </h2>
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-16">Estamos construindo o melhor sistema de bar do Brasil. Nossos primeiros parceiros usam tudo sem pagar nada.</p>
          </div>

          <div className="scroll-reveal p-10 md:p-14 rounded-[40px] bg-slate-900/50 border border-emerald-500/20 relative overflow-hidden shine">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-2 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/30">Acesso Total Early Adopter</div>

            <div className="pt-8 mb-10">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-slate-400 text-2xl font-bold line-through">R$ 197</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">/mês</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl md:text-8xl font-black text-white">R$ 0</span>
                <span className="text-xl font-bold text-slate-300">/mês</span>
              </div>
              <p className="text-emerald-400 font-bold text-sm mt-3">100% gratuito para parceiros fundadores.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-10">
              {[
                'PDV Completo + Venda Expressa',
                'Conferência Cega + Auditoria',
                'Relatórios + Curva ABC',
                'Controle de Equipe (+20 perm.)',
                'Multi-Unidades',
                'Funciona Offline',
                'WhatsApp Recibos',
                'Suporte Prioritário',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 py-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-sm text-slate-300 font-medium">{f}</span>
                </div>
              ))}
            </div>

            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center gap-3 bg-[#16a34a] text-white px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 w-full justify-center sm:w-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Contratar
            </a>

            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem cartão Sem contrato Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">Perguntas Frequentes</h2>
            
            {/* FAQ Search */}
            <div className="relative max-w-md mx-auto">
               <input 
                  type="text" 
                  placeholder="Busque uma dúvida (ex: offline, grátis...)" 
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-red-500/50 transition-all text-center"
               />
               <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredFAQs.length === 0 ? (
               <div className="py-10 text-center opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhuma resposta encontrada para sua busca</p>
               </div>
            ) : (
               filteredFAQs.map((faq, i) => (
                  <div key={i} className="scroll-reveal group border-b border-white/5 cursor-pointer" onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}>
                    <div className="flex justify-between items-center py-6 group-hover:text-red-500 transition-colors">
                      <span className="text-base font-bold pr-4">{faq.q}</span>
                      <span className={`text-xl font-black flex-shrink-0 transition-transform duration-300 ${activeFAQ === i ? 'rotate-45' : ''}`}>+</span>
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ${activeFAQ === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                      <p className="text-slate-300 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
               ))
            )}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="scroll-reveal p-10 rounded-3xl bg-gradient-to-b from-emerald-900/20 to-transparent border border-emerald-500/20">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">
              Pronto pra <span className="text-emerald-400">tirar a prova</span>?
            </h3>
            <p className="text-slate-300 mb-8 text-sm">São 2 minutos. Sem compromisso. Sem cartão.</p>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center gap-3 bg-[#16a34a] text-white px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95">
              WhatsApp
            </a>
            <a href="/?demo=true" className="inline-flex items-center gap-3 bg-slate-900 border border-white/10 text-white px-10 py-4 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 ml-4">
              Testar Demo
            </a>
          </div>
        </div>
      </section>



      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-barrio text-lg">B</div>
            <span className="text-lg font-black uppercase font-barrio text-slate-300">Botequista</span>
          </div>
          <p className="text-xs font-bold text-slate-400">&copy; {new Date().getFullYear()} Botequista. Todos os direitos reservados.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-red-500 transition-colors cursor-pointer">Privacidade</button>
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-red-500 transition-colors cursor-pointer">Termos</button>
          </div>
        </div>
      </footer>

      {/* ─── NERD MODAL v2 ─── */}
      {isNerdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={() => setIsNerdModalOpen(false)} />
          
          <div className="relative bg-[#0a0f1e] border border-emerald-500/20 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col font-mono">
            <div className="scanline"></div>
            
            {/* Terminal Header */}
            <div className="bg-slate-900/50 p-4 flex justify-between items-center border-b border-white/5 relative z-20">
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <div onClick={() => setIsNerdModalOpen(false)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="flex gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span className="text-emerald-500/50">root@botequista:</span>
                  <span>~/architecture_v4.9.0</span>
                </div>
              </div>
              <div className="text-[10px] font-black text-emerald-500 animate-pulse tracking-tighter">
                SYSTEM STATUS: OPTIMIZED
              </div>
            </div>

            {/* Terminal Tabs */}
            <div className="flex bg-slate-950/50 border-b border-white/5 relative z-20">
              {[
                { id: 'stack', label: '01. TECH_STACK', icon: '🛠️' },
                { id: 'sync', label: '02. SYNC_ENGINE', icon: '🔄' },
                { id: 'perf', label: '03. BENCHMARKS', icon: '⚡' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setNerdTab(tab.id as any)}
                  className={`px-6 py-3 text-[10px] font-black tracking-widest transition-all border-r border-white/5 flex items-center gap-2 ${
                    nerdTab === tab.id ? 'bg-[#0a0f1e] text-emerald-400 border-t-2 border-t-emerald-500' : 'text-slate-500 hover:bg-white/5'
                  }`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-8 relative z-20 no-scrollbar">
              {nerdTab === 'stack' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'CORE', val: 'React 19 + TS', color: 'text-blue-400' },
                      { label: 'DB', val: 'Firebase NoSQL', color: 'text-amber-400' },
                      { label: 'LOCAL', val: 'IndexedDB', color: 'text-emerald-400' },
                      { label: 'GIT', val: 'GitHub Backup', color: 'text-purple-400' },
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{item.label}</div>
                        <div className={`text-xs font-black uppercase ${item.color}`}>{item.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <p className="text-emerald-500 text-xs font-bold flex items-center gap-2">
                      <span className="text-white">$</span> botequista --analyze-stack
                    </p>
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 text-slate-400 text-xs leading-relaxed font-mono">
                      <Typewriter text="A arquitetura do Botequista foi desenhada para resiliência extrema. Utilizamos um modelo de 'Single Source of Truth' distribuído: o estado da aplicação vive no IndexedDB (local) para latência zero, enquanto a sincronização atômica garante que múltiplos aparelhos operem na mesma mesa sem conflitos de dados. O sistema também oferece integração exclusiva com o GitHub para backup privado e versionado do seu banco de dados." />
                      <span className="terminal-cursor"></span>
                    </div>
                  </div>
                </div>
              )}

              {nerdTab === 'sync' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative p-12 bg-slate-950/50 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-12 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]"></div>
                    
                    {/* Visual Flow */}
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full justify-around">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">📱</div>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">Client App</div>
                      </div>
                      <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-amber-500/50 relative">
                        <div className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-500 rounded-full -translate-y-1/2 animate-[ping_2s_infinite]"></div>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(245,158,11,0.1)]">💾</div>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">IndexedDB</div>
                      </div>
                      <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-amber-500/50 to-red-500/50 relative">
                         <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-amber-500 rounded-full -translate-y-1/2 animate-[ping_2s_infinite_0.5s]"></div>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-red-500/30 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(239,68,68,0.1)]">☁️</div>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">Firebase</div>
                      </div>
                    </div>

                    <div className="text-center space-y-2 max-w-lg relative z-10">
                      <h4 className="text-emerald-500 text-xs font-black uppercase tracking-widest">Protocolo Offline-First</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed italic">
                        "O dado é salvo localmente em &lt; 5ms. A fila de sincronização (SyncQueue) tenta o upload em background. Se a internet falhar, o bar continua operando normalmente via Cache Local."
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {nerdTab === 'perf' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: 'Latency (Offline Write)', val: '2.4ms', target: 98 },
                      { label: 'UI Response Time', val: '12ms', target: 95 },
                      { label: 'Cold Boot Speed', val: '0.8s', target: 92 },
                      { label: 'Memory Leak Audit', val: 'PASS', target: 100 },
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-end">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                          <div className="text-emerald-500 font-bold text-xs">{stat.val}</div>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 animate-[grow_1s_ease-out_forwards]" 
                            style={{ width: `${stat.target}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-500/70 text-center font-bold">
                    BENCHMARKS EXECUTADOS EM AMBIENTE DE PRODUÇÃO (VERCEL EDGE)
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Footer */}
            <div className="bg-slate-950 p-4 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-600 tracking-widest relative z-20">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYNC_READY</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> DB_CONNECTED</span>
              </div>
              <div>BOTEQUISTA_SYSTEM_V4.9.0_STABLE</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIVACY MODAL ─── */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setIsPrivacyOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-5 flex justify-between items-center border-b border-slate-700">
              <h3 className="text-lg font-black uppercase tracking-wider">🔒 Política de Privacidade</h3>
              <button onClick={() => setIsPrivacyOpen(false)} className="text-slate-200 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-300 text-sm leading-relaxed no-scrollbar">
              <p className="text-slate-300 text-xs">Última atualização: Abril de 2026</p>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">1. Dados Coletados</h4>
                <p>O Botequista coleta apenas os dados estritamente necessários para o funcionamento do sistema de gestão do seu estabelecimento: informações de produtos, vendas, operadores, mesas e movimentações financeiras. Não coletamos dados pessoais dos clientes finais do seu bar.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">2. Armazenamento e Segurança</h4>
                <p>Seus dados são armazenados em três camadas: localmente no dispositivo via IndexedDB (com criptografia AES-256), na nuvem Firebase com conexão TLS, e opcionalmente em backups manuais em arquivo JSON. Todo o tráfego é criptografado em trânsito e em repouso.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">3. Compartilhamento</h4>
                <p>Não vendemos, alugamos ou compartilhamos seus dados com terceiros. Os dados do seu bar são exclusivamente seus. O acesso à infraestrutura de nuvem é restrito à equipe técnica do Botequista mediante autenticação de dois fatores.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">4. Isolamento de Dados</h4>
                <p>Cada unidade (bar) possui um banco de dados isolado com identificador único (unitId). Os dados de uma unidade são invisíveis para operadores de outra unidade, salvo quando o administrador possui acesso explícito a múltiplas unidades.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">5. Seus Direitos</h4>
                <p>Você pode solicitar a exportação completa dos seus dados a qualquer momento via funcionalidade de Backup do sistema. Para solicitar a exclusão total dos seus dados dos nossos servidores, entre em contato pelo WhatsApp.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">6. Cookies e Rastreamento</h4>
                <p>O Botequista não utiliza cookies de rastreamento ou ferramentas de analytics de terceiros. Não rastreamos o comportamento de navegação dos operadores fora do sistema.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TERMS MODAL ─── */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setIsTermsOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-5 flex justify-between items-center border-b border-slate-700">
              <h3 className="text-lg font-black uppercase tracking-wider">📜 Termos de Uso</h3>
              <button onClick={() => setIsTermsOpen(false)} className="text-slate-200 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-300 text-sm leading-relaxed no-scrollbar">
              <p className="text-slate-300 text-xs">Última atualização: Abril de 2026</p>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">1. Aceitação dos Termos</h4>
                <p>Ao utilizar o sistema Botequista, você concorda com estes termos de uso. O Botequista é um sistema de gestão para bares e restaurantes fornecido como SaaS (Software as a Service) pela Botequista Systems.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">2. Licença de Uso</h4>
                <p>Concedemos a você uma licença limitada, não-exclusiva, intransferível e revogável para utilizar o sistema Botequista para fins de gestão do seu estabelecimento comercial. Esta licença não inclui o direito de revender, sublicenciar, modificar ou fazer engenharia reversa do software.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">3. Programa Early Adopter</h4>
                <p>O acesso gratuito é concedido a parceiros fundadores durante a fase de expansão do Botequista. A empresa reserva o direito de introduzir planos pagos no futuro, garantindo aos participantes do programa Early Adopter condições especiais de transição com aviso prévio mínimo de 90 dias.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">4. Responsabilidades do Usuário</h4>
                <p>O usuário é responsável por: manter a segurança das credenciais de acesso, garantir a veracidade dos dados inseridos, utilizar o sistema apenas para fins legais, e realizar backups periódicos dos seus dados como medida adicional de segurança.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">5. Disponibilidade do Serviço</h4>
                <p>O Botequista é projetado com arquitetura Offline-First, garantindo funcionamento mesmo sem conexão à internet. A sincronização com a nuvem depende da disponibilidade da infraestrutura Firebase e Vercel. Não garantimos disponibilidade de 100% dos serviços em nuvem, embora nosso objetivo seja manter uptime superior a 99.5%.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">6. Limitação de Responsabilidade</h4>
                <p>O Botequista não se responsabiliza por prejuízos financeiros decorrentes de falhas operacionais, perda de dados por mau uso do sistema, ou decisões de negócio baseadas nos relatórios gerados. O sistema é uma ferramenta de apoio à gestão, não substitui a responsabilidade gerencial do proprietário.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">7. Cancelamento</h4>
                <p>Você pode cancelar o uso do sistema a qualquer momento, sem multas ou taxas. Após o cancelamento, seus dados podem ser exportados em até 30 dias. Após esse prazo, nos reservamos o direito de remover seus dados dos nossos servidores.</p>
              </div>
              <div>
                <h4 className="text-white font-black uppercase text-xs tracking-widest mb-3">8. Contato</h4>
                <p>Para dúvidas, sugestões ou solicitações referentes a estes termos, entre em contato pelo WhatsApp disponível na página principal do Botequista.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING CTA (Mobile) ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden">
        <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow flex items-center gap-2 bg-[#16a34a] text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-tight shadow-2xl active:scale-95 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Testar Grátis
        </a>
      </div>
    </div>
  );
};
