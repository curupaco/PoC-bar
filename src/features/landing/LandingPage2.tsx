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
  { src: '/landing_assets/assets/pos_real.png', label: 'PDV Terminal de Vendas', desc: 'Favoritos, busca instantânea e comanda em tempo real' },
  { src: '/landing_assets/assets/dashboard_real.png', label: 'Mesas Gestão Visual', desc: 'Mesas coloridas por status: ociosa, ativa, em risco' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-28-56.png', label: 'Checkout Fechamento', desc: 'Dinheiro, Pix, Cartão ou Pendura tudo em uma tela' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-29-40.png', label: 'Conferência Cega', desc: 'O operador informa o valor fisico sem ver o esperado' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-06.png', label: 'Tesouraria Caixa', desc: 'Sangria, suprimento e cofre com teclado numérico' },
  { src: '/landing_assets/assets/reports_real.png', label: 'Relatórios', desc: '7 tipos de relatório com exportação PNG e por turno' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-54.png', label: 'Equipe RBAC', desc: '20+ permissões granulares por colaborador' },
  { src: '/landing_assets/assets/Screenshot_2026-03-03_21-32-39.png', label: 'Auditoria', desc: 'Todas as ações críticas registradas em tempo real' },
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


// ─── MAIN COMPONENT ───
export const LandingPage2: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

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
      `}</style>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-[#020617]/85 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-barrio text-xl shadow-lg shadow-red-600/20">B</div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase font-barrio leading-none">Botequista</span>
              <span className="text-[7px] font-black tracking-[0.4em] uppercase text-red-500 italic">Versão 4.3</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-10">
            <button onClick={() => scrollToSection('problema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">O Problema</button>
            <button onClick={() => scrollToSection('solucao')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Solução</button>
            <button onClick={() => scrollToSection('sistema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Sistema</button>
            <button onClick={() => scrollToSection('preco')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Preço</button>
            <button onClick={() => setIsNerdModalOpen(true)} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">🤓 Tech</button>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-900/30">
              Testar Grátis
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
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full max-w-xs bg-[#25D366] text-white px-8 py-4 rounded-2xl text-center text-lg font-black uppercase tracking-tight shadow-xl">
              Testar Grátis
            </a>
          </div>
        </div>
      </nav>

      <main>
      {/* ─── HERO ─── */}
      <section className="hero-gradient relative pt-16 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 scroll-reveal">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            100% Gratuito Sem cartão de crédito
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 uppercase scroll-reveal">
            <span className="text-gradient block">Seu bar perde</span>
            <span className="text-red-600 block italic">dinheiro</span>
            <span className="text-gradient block">todo dia</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-14 leading-relaxed font-medium max-w-3xl mx-auto scroll-reveal">
            Caixa que não bate. Garçom que some. Fiado que ninguém cobra.
            <br className="hidden sm:block" />
            O <span className="text-white font-bold">Botequista</span> resolve tudo isso — e <span className="text-emerald-400 font-bold">é grátis</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-20 scroll-reveal">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow group bg-[#25D366] text-white px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Começar Agora Grátis
            </a>
          </div>

          {/* Hero Image */}
          <div className="max-w-5xl mx-auto scroll-reveal">
            <BrowserFrame
              src="/landing_assets/assets/dashboard_real.png"
              alt="Painel de Vendas Real do Botequista"
              label="Screenshot Real Sistema em Produção"
            />
          </div>
        </div>
      </section>



      {/* ─── THE PROBLEM ─── */}
      <section id="problema" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-4 block">O Elefante na sala</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Você sabe quanto <span className="text-red-600 italic">perde</span> por mês?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '💸', title: 'Caixa Furado', desc: 'O operador "ajusta" os números antes de fechar. Você não sabe o valor real da gaveta.' },
              { icon: '📉', title: 'Fiado Sem Controle', desc: 'Clientes devem. Você anota num caderno. Metade some.' },
              { icon: '🌐', title: 'Internet Caiu = Bar Parou', desc: 'Outros sistemas travam. Você perde vendas no horário de pico.' },
              { icon: '🐢', title: 'Atendimento Lento', desc: 'Garçom abrindo menu, digitando, esperando carregamento. O cliente vai embora.' },
              { icon: '🔒', title: 'Zero Auditoria', desc: 'Cancelaram uma venda? Quem? Quando? Você nunca vai saber.' },
              { icon: '📊', title: 'Sem Dados, Sem Lucro', desc: 'Você não sabe quais produtos dão lucro e quais só ocupam geladeira.' },
            ].map((p, i) => (
              <div key={i} className="scroll-reveal group p-8 rounded-3xl bg-red-950/20 border border-red-900/20 hover:border-red-600/30 transition-all">
                <div className="text-3xl mb-5">{p.icon}</div>
                <h3 className="text-white font-black uppercase text-sm tracking-wide mb-3">{p.title}</h3>
                <p className="text-red-300/60 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 scroll-reveal">
            <p className="text-2xl md:text-3xl font-black text-slate-200 italic tracking-tight">
              "Se você se identificou com <span className="text-red-500">2 ou mais</span>, o Botequista é pra você."
            </p>
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
            <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto">Projetado para o bar da vida real com internet instável, funcionário de passagem e sexta-feira lotada</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon="📶" title="Funciona Sem Internet" desc="Toda venda salva no aparelho na hora. Quando a internet volta, sincroniza sozinho. Seu bar nunca para." accent="emerald" />
            <FeatureCard icon="⚡" title="Venda em 3 Cliques" desc="Modo Expresso: comanda automática, favoritos no topo, atalhos de teclado. Checkout em menos de 2 segundos." accent="emerald" />
            <FeatureCard icon="🕵️" title="Conferência Cega" desc="O operador conta o dinheiro sem ver o valor do sistema. Impossível 'ajustar' a contagem. Você vê a verdade." accent="emerald" />
            <FeatureCard icon="📊" title="Curva ABC Inteligente" desc="Saiba exatamente quais produtos dão lucro e quais são prejuízo. Filtre por volume ou faturamento." accent="emerald" />
            <FeatureCard icon="👥" title="Controle de Equipe" desc="20+ permissões granulares. Defina quem pode cancelar venda, fechar caixa, ver relatórios." accent="emerald" />
            <FeatureCard icon="🏢" title="Multi-Unidades" desc="Gerencie várias lojas com dados isolados. Dashboard consolidado. Ideal para franquias." accent="emerald" />
          </div>

          {/* Highlight: Offline */}
          <div className="mt-20 p-10 md:p-16 rounded-[40px] bg-emerald-950/20 border border-emerald-900/30 scroll-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4">Exclusividade Botequista</div>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                  O único sistema <span className="text-emerald-500">onde a internet é opcional</span>.
                </h3>
                <p className="text-slate-200 text-lg leading-relaxed mb-8">
                  O Botequista trata a nuvem como um "estado eventual". Seus dados são salvos <strong className="text-white">localmente no dispositivo</strong> antes de qualquer coisa. Acabou a internet da operadora? O bar continua faturando.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['IndexedDB Local', 'Sync Automática', 'Backup em 3 Camadas', 'Resgate de Emergência'].map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex flex-col items-center gap-4 p-10 rounded-3xl bg-slate-950/50 border border-emerald-500/10">
                  <div className="text-6xl float-anim">📶</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Disponibilidade</div>
                  <div className="text-7xl font-black text-white"><AnimatedCounter target={99} suffix="%" /></div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Mesmo com queda de internet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REAL SCREENSHOTS ─── */}
      <section id="sistema" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block">Veja com seus olhos</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Zero mockup. <span className="text-red-600 italic">Tudo Real.</span>
            </h2>
            <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto">Capturas de tela reais do sistema em produção. O Botequista é exatamente assim — sem filtro, sem photoshop.</p>
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
              'PDV completo com Venda Expressa',
              'Gestão de mesas e comandas',
              'Cardápio com adicionais e variações',
              'Tesouraria com sangria e suprimento',
              'Conferência Cega de caixa',
              '7 tipos de relatório gerencial',
              'Controle de equipe (20+ permissões)',
              'Gestão de Penduras (Fiado)',
              'Suporte a múltiplas unidades',
              'Registro de auditoria completo',
              'Backup automático nuvem + local',
              'Dark Mode para ambientes noturnos',
              'Recibos via WhatsApp',
              'Curva ABC de produtos',
              'Heatmap de horário de pico',
              'Ranking de performance da equipe',
              'Funciona em tablet, celular e PC',
              'Funciona 100% offline',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-5 rounded-xl hover:bg-white/[0.02] transition-colors group">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm font-medium text-slate-300">{f}</span>
              </div>
            ))}
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
              { f: 'Funciona Offline', b: true, t: false },
              { f: 'Conferência Cega de Caixa', b: true, t: false },
              { f: 'Sinalização de Mesa Ociosa', b: true, t: false },
              { f: 'Curva ABC por Faturamento', b: true, t: false },
              { f: 'Atalhos de Teclado (PDV Ninja)', b: true, t: false },
              { f: 'Multi-Unidades com Isolamento', b: true, t: true },
              { f: 'Gestão de Fiado (Pendura)', b: true, t: true },
              { f: 'Registro de Auditoria', b: true, t: true },
              { f: 'Funciona em Qualquer Dispositivo', b: true, t: false },
              { f: 'Preço Acessível', b: true, t: false },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Ricardo', bar: 'Bar do Galego', quote: 'Antes eu perdia R$200 por semana em caixa furado. Depois da conferência cega, o caixa bate 100% dos dias. É impressionante.', role: 'Proprietário', stars: 5 },
              { name: 'Mariana', bar: 'Sunset Lounge', quote: 'A Curva ABC me mostrou que eu estava perdendo margem com uma cerveja que eu achava que era a melhor. Mudei o cardápio e meu lucro subiu 18%.', role: 'Gerente', stars: 5 },
              { name: 'Ozzy', bar: 'Botequim Gourmet', quote: 'Gerencio minhas 3 unidades de casa. O sistema funciona até quando meu garçom deixa o tablet sem Wi-Fi. Paz de espírito total.', role: 'Franqueador', stars: 5 },
            ].map((t, i) => (
              <div key={i} className="scroll-reveal p-8 rounded-3xl bg-slate-900/40 border border-white/5 hover:border-red-500/20 transition-all group">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-8 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 font-black text-sm">{t.name[0]}</div>
                  <div>
                    <div className="text-white font-bold text-sm">{t.name}</div>
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.role} {t.bar}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-16">Estamos construindo o melhor sistema de bar do Brasil. Nossos primeiros parceiros usam tudo — sem pagar nada.</p>
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
                'Controle de Equipe (20+ perm.)',
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

            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center gap-3 bg-[#25D366] text-white px-12 py-5 rounded-2xl text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 w-full justify-center sm:w-auto">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Ativar Minha Conta Grátis
            </a>

            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sem cartão Sem contrato Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Perguntas Frequentes</h2>
          </div>
          {[
            { q: 'O sistema funciona de verdade sem internet?', a: 'Sim. Cada dispositivo tem seu próprio banco de dados local (IndexedDB). As vendas são salvas instantaneamente no aparelho e sincronizadas com a nuvem quando a conexão volta. Seu bar literalmente nunca para.' },
            { q: 'Preciso de algum equipamento especial?', a: 'Não. Funciona em qualquer dispositivo com navegador moderno: tablet Android, iPad, notebook, PC. Recomendamos ter um teclado se quiser usar os atalhos do PDV Ninja para máxima velocidade.' },
            { q: 'Quanto tempo leva para começar a usar?', a: 'Em menos de 15 minutos você cadastra seu cardápio e já pode lançar a primeira venda. A configuração é guiada — não precisa de equipe de TI.' },
            { q: 'E se minha equipe não souber mexer em tecnologia?', a: 'A interface foi desenhada para operação noturna com botões grandes e fluxos simples. Nossos garçons de teste aprenderam em 10 minutos, sem manual.' },
            { q: 'Por que é grátis? Qual é a pegadinha?', a: 'Estamos em fase de expansão e queremos parceiros que nos ajudem a refinar o produto. Não tem pegadinha, não tem cartão, não tem contrato. Quando o preço mudar, os fundadores mantêm condições especiais.' },
            { q: 'Meus dados ficam seguros?', a: 'Seus dados são salvos em 3 camadas: nuvem Firebase, IndexedDB local e backup manual em arquivo. Temos criptografia AES-256, registro de auditoria e guardas contra perda acidental.' },
          ].map((faq, i) => (
            <div key={i} className="scroll-reveal group border-b border-white/5 cursor-pointer" onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}>
              <div className="flex justify-between items-center py-6 group-hover:text-red-500 transition-colors">
                <span className="text-base font-bold pr-4">{faq.q}</span>
                <span className={`text-xl font-black flex-shrink-0 transition-transform duration-300 ${activeFAQ === i ? 'rotate-45' : ''}`}>+</span>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${activeFAQ === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                <p className="text-slate-300 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
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
          <p className="text-xs font-bold text-slate-400">&copy; {new Date().getFullYear()} Botequista Systems. Todos os direitos reservados.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-red-500 transition-colors cursor-pointer">Privacidade</button>
            <button onClick={() => setIsTermsOpen(true)} className="hover:text-red-500 transition-colors cursor-pointer">Termos</button>
          </div>
        </div>
      </footer>

      {/* ─── NERD MODAL ─── */}
      {isNerdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setIsNerdModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-5 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <h3 className="text-lg font-mono font-bold text-emerald-500">&gt; cat architecture.v4.3</h3>
              </div>
              <button onClick={() => setIsNerdModalOpen(false)} className="text-slate-200 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 font-mono text-sm leading-relaxed space-y-6 text-slate-300 no-scrollbar">
              <div className="space-y-3">
                <p className="text-emerald-500 font-bold">$ stack --overview</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-l-2 border-slate-700 pl-6">
                  <div><span className="text-emerald-400">Frontend:</span> React 19 + TypeScript</div>
                  <div><span className="text-emerald-400">Styling:</span> Tailwind CSS (Dark Mode)</div>
                  <div><span className="text-emerald-400">Database:</span> Firebase RTDB (NoSQL)</div>
                  <div><span className="text-emerald-400">Offline:</span> IndexedDB (idb wrapper)</div>
                  <div><span className="text-emerald-400">Deploy:</span> Vercel Edge Functions</div>
                  <div><span className="text-emerald-400">Security:</span> AES-256 + RBAC</div>
                  <div><span className="text-emerald-400">Bundler:</span> Vite 6</div>
                  <div><span className="text-emerald-400">PWA:</span> Service Workers + Cache</div>
                </div>
              </div>
              <div className="p-5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-emerald-500 mb-3 font-bold">$ sync --explain</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Arquitetura Offline-First com SyncQueue resiliente. Cada operação de escrita é primeiro persistida no IndexedDB local (latência ~1ms),
                  depois enfileirada para sincronização em background com Firebase RTDB. Estratégia de conflito: Last-Write-Wins com timestamp do cliente.
                  Exponential backoff para retry. Guardas beforeunload impedem perda de dados pendentes. Disponibilidade efetiva: 99.9% mesmo em redes instáveis.
                </p>
              </div>
              <div className="p-5 bg-slate-950/50 rounded-xl border border-slate-800">
                <p className="text-emerald-500 mb-3 font-bold">$ perf --benchmark</p>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                  <div>Checkout latency: <span className="text-white">&lt; 50ms</span></div>
                  <div>Cold start (PWA): <span className="text-white">&lt; 2s</span></div>
                  <div>Offline write: <span className="text-white">&lt; 5ms</span></div>
                  <div>Memory footprint: <span className="text-white">~45MB</span></div>
                </div>
              </div>
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
        <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-tight shadow-2xl active:scale-95 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Testar Grátis
        </a>
      </div>
    </div>
  );
};
