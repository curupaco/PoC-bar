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
const BrowserFrame: React.FC<{ src?: string; alt?: string; label?: string; callout?: string; children?: React.ReactNode }> = ({ src, alt, label, callout, children }) => (
  <div className="relative group w-full max-w-full mx-auto scroll-reveal">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-2">
      {label && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{label}</span>
        </div>
      )}
      {callout && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <span className="text-[10px]">🍺</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">{callout}</span>
        </div>
      )}
    </div>
    <div className="rounded-3xl bg-slate-800/90 p-1.5 sm:p-2 shadow-2xl shadow-black/60 border border-white/10 overflow-hidden w-full backdrop-blur-sm">
      <div className="bg-slate-900 h-8 flex items-center px-4 gap-2 rounded-t-2xl border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60"></div>
        </div>
        <div className="flex-1 max-w-[200px] mx-auto bg-slate-950/70 h-5 rounded-full border border-white/5 flex items-center px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></div>
          <span className="text-[8px] font-mono text-slate-400 truncate">botequista.app • modo_balcao</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[8px] font-mono text-emerald-400 font-bold">
          <span>●</span> OFFLINE-READY
        </div>
      </div>
      <div className="relative aspect-video overflow-hidden bg-slate-950 rounded-b-2xl">
        {src ? (
          <>
            <img 
              src={src} 
              alt={alt || label || 'Tela do Botequista'} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent pointer-events-none"></div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  </div>
);

// ─── Feature Card ───
const FeatureCard: React.FC<{ icon: string; title: string; desc: string; tag?: string; accent?: 'red' | 'emerald' | 'amber' }> = ({ icon, title, desc, tag, accent = 'emerald' }) => {
  const accentStyles = {
    red: 'hover:border-red-500/40 hover:shadow-red-900/15 bg-gradient-to-b from-red-950/10 to-slate-900/50',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-900/15 bg-gradient-to-b from-emerald-950/10 to-slate-900/50',
    amber: 'hover:border-amber-500/40 hover:shadow-amber-900/15 bg-gradient-to-b from-amber-950/10 to-slate-900/50',
  }[accent];

  const iconBg = {
    red: 'bg-red-600/15 text-red-400 border-red-500/20',
    emerald: 'bg-emerald-600/15 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  }[accent];

  const tagColor = {
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  }[accent];

  return (
    <div className={`scroll-reveal group p-7 rounded-3xl border border-white/10 ${accentStyles} transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className={`w-13 h-13 rounded-2xl border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${iconBg}`}>
            {icon}
          </div>
          {tag && (
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${tagColor}`}>
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-white font-black text-base uppercase tracking-tight mb-2.5">{title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

// ─── Screenshot Gallery with Tabs & Interactive Previews ───
const screenshots = [
  {
    src: '/landing_assets/assets/pos_real.png',
    label: '🍺 Balcão & PDV',
    callout: 'Lança uma rodada em menos de 2 segundos',
    desc: 'As brejas e porções que mais saem ficam grudadas no topo. Tem botão "Repetir Saideira" pra mandar mais duas na Mesa 4 com um toque só.'
  },
  {
    src: '/landing_assets/assets/dashboard_real.png',
    label: '🪑 Mapa de Mesas',
    callout: 'Bateu o olho, sabe quem tá com sede',
    desc: 'Salão inteiro na mão: verde tá consumindo bonito, amarelo já deu uma parada, vermelho é mesa moscando — hora do garçom encostar e oferecer a saideira.'
  },
  {
    src: '/landing_assets/assets/Screenshot_2026-03-03_21-28-56.png',
    label: '🧮 Racha a Conta',
    callout: 'Sem calculadora e sem fila no caixa',
    desc: 'Um pagou no Pix, outro no débito, o terceiro deixou pendurado? Divide por cabeça ou por item na mesma tela, com os 10% do garçom já separados.'
  },
  {
    src: '/landing_assets/assets/Screenshot_2026-03-03_21-29-40.png',
    label: '🕵️ Fechamento no Escuro',
    callout: 'Acabou o "acerto criativo" às 2h da manhã',
    desc: 'Conferência Cega de verdade: quem fecha o caixa digita quanto contou na gaveta sem ver quanto o sistema espera. Você vê na lata se sobrou ou faltou.'
  },
  {
    src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-06.png',
    label: '💵 Gaveta & Sangria',
    callout: 'Pagou o gelo ou o limão com dinheiro do caixa?',
    desc: 'Sangria, reforço de troco e retirada pro cofre em dois cliques. Fica tudo carimbado pra ninguém esquecer pra onde foram aqueles R$ 50 da tarde.'
  },
  {
    src: '/landing_assets/assets/reports_real.png',
    label: '📊 Raio-X do Turno',
    callout: 'Sete relatórios mastigados sem juridiquês',
    desc: 'Lucro líquido real (descontando custo), Curva ABC de produtos, ranking de garçom que mais puxa venda e resumo pronto pra mandar no Zap do sócio.'
  },
  {
    src: '/landing_assets/assets/Screenshot_2026-03-03_21-30-54.png',
    label: '🔑 Crachá Digital',
    callout: 'Cada um no seu quadrado',
    desc: 'Cada funcionário tem seu login e nível de acesso: você escolhe no detalhe quem pode cancelar item, quem pode dar desconto e quem só lança pedido.'
  },
  {
    src: '/landing_assets/assets/Screenshot_2026-03-03_21-32-39.png',
    label: '🛡️ Dedo-Duro (Auditoria)',
    callout: 'Caixa preta do seu boteco',
    desc: 'Apagaram uma porção depois que a conta já tinha ido pra mesa? O sistema grava quem fez, a que horas e de qual aparelho. Zero ponto cego.'
  },
  {
    customType: 'kitchen',
    label: '🍳 Cozinha (Ding! 🛎️)',
    callout: 'Tela Touch na cozinha + campainha no salão',
    desc: 'Acabou o grito no balcão e a comanda suja de óleo. O pedido cai na tela da cozinha na hora; quando o cozinheiro aperta "Pronto", apita no celular do garçom.'
  },
  {
    customType: 'drinks',
    label: '🍸 Coquetelaria & Lotes',
    callout: 'Controle por mililitro e xaropes da casa',
    desc: 'Ficha técnica fracionada em ml, cálculo de CMV ao vivo, produção de batches/xaropes artesanais com etiqueta de validade e baixa de quebra de garrafa.'
  },
];

const ScreenshotGallery: React.FC = () => {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [readyOrders, setReadyOrders] = useState<number[]>([2]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % screenshots.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const current = screenshots[active] as any;

  const toggleOrderReady = (id: number) => {
    setReadyOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div
      className="scroll-reveal"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Category Pills on Top for immediate clarity */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap max-w-4xl mx-auto">
        {screenshots.map((s, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); setIsPaused(true); }}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              i === active
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105 border border-red-400/40'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto">
        {current.customType === 'kitchen' ? (
          <BrowserFrame
            label={current.label}
            callout={current.callout}
          >
            <div className="w-full h-full bg-slate-950 p-4 sm:p-8 flex flex-col justify-between text-left overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍳</span>
                  <div>
                    <div className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">Monitor de Produção — Chapa & Fritadeira</div>
                    <div className="text-[10px] text-emerald-400 font-bold">● Sincronizado em Tempo Real • Campainha Sonora Ativa</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase">
                  Clique em "Bater Campainha" para testar 👇
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto py-4">
                {[
                  { id: 1, table: 'Mesa 04 (Calçada)', time: 'há 3 min', item: '1x Porção Coxinha da Asa (12 un)', obs: 'Bem fritinha + molho de pimenta à parte', waiter: 'Galego' },
                  { id: 2, table: 'Mesa 11 (Salão)', time: 'há 7 min', item: '2x Pastel Misto (Carne/Queijo)', obs: 'Cortar no meio pra dividir', waiter: 'Beto' },
                  { id: 3, table: 'Balcão • Seu Jorge', time: 'há 1 min', item: '1x Calabresa Acebolada no Tacho', obs: 'Capricha no pão francês', waiter: 'Galego' },
                ].map((order) => {
                  const isDone = readyOrders.includes(order.id);
                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-slate-900/90 border-amber-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black uppercase text-white">{order.table}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {isDone ? '🛎️ Garçom Avisado!' : `⏳ ${order.time}`}
                          </span>
                        </div>
                        <div className="text-sm font-black text-white mb-1">{order.item}</div>
                        <div className="text-[11px] text-amber-300/90 italic bg-slate-950/60 p-2 rounded-lg border border-white/5 mb-3">
                          "{order.obs}"
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrderReady(order.id)}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isDone
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                        }`}
                      >
                        {isDone ? '✓ Pedido Entregue (Reabrir)' : '🛎️ Bater Campainha (Pronto!)'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between items-center pt-2 border-t border-white/5">
                <span>Tempo médio de saída hoje: <strong className="text-emerald-400">6m 40s</strong></span>
                <span>Zero comandas de papel perdidas</span>
              </div>
            </div>
          </BrowserFrame>
        ) : current.customType === 'drinks' ? (
          <BrowserFrame
            label={current.label}
            callout={current.callout}
          >
            <div className="w-full h-full bg-slate-950 p-4 sm:p-8 flex flex-col justify-between text-left overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍸</span>
                  <div>
                    <div className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">Central de Coquetelaria, Batches & Quebras</div>
                    <div className="text-[10px] text-amber-400 font-bold">● Baixa Automática em Mililitros (ml) • Validade de Xaropes</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                  Margem Média do Bar: 79,4%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto py-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/20 space-y-2.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">🍹 Ficha Fracionada (50ml)</div>
                  <div className="text-sm font-black text-white">Rabo de Galo da Casa</div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex justify-between"><span>Cachaça Envelhecida (50ml)</span><span className="text-white font-bold">R$ 2,80</span></div>
                    <div className="flex justify-between"><span>Vermute Tinto (25ml)</span><span className="text-white font-bold">R$ 1,85</span></div>
                    <div className="flex justify-between"><span>Cynar + Casca Laranja (15ml)</span><span className="text-white font-bold">R$ 1,20</span></div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Custo: <strong className="text-amber-400">R$ 5,85</strong></span>
                    <span className="text-emerald-400 font-black">Venda: R$ 28,00</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/20 space-y-2.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">🍯 Batch Caseiro Ativo</div>
                  <div className="text-sm font-black text-white">Xarope de Gengibre #L14</div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    Produzido na terça • Abateu <strong className="text-white">1kg Açúcar + 400g Gengibre</strong> do estoque bruto.
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                    ✓ Fresco na Geladeira (Vence em 11 dias) • Custo: R$ 6,20/L
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-red-500/20 space-y-2.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-red-400">🚨 Auditoria de Quebra/Perda</div>
                  <div className="text-sm font-black text-white">Garrafas & Doses Vigia</div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    Cada drink vendido no PDV desconta os ml exatos da garrafa aberta. Se cair no chão, registra a perda em 2 toques.
                  </div>
                  <div className="p-2 rounded-xl bg-red-950/30 border border-red-500/20 text-[10px] text-red-300 font-bold">
                    Zero "evaporação misteriosa" de Gin e Whisky no fim de semana
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex justify-between items-center pt-2 border-t border-white/5">
                <span>Boteco tradicional só de litrão? <strong className="text-white">Desligue este módulo em 1 clique</strong></span>
                <span className="text-amber-400 font-bold">Role para baixo e teste a Calculadora de Drinks ↓</span>
              </div>
            </div>
          </BrowserFrame>
        ) : (
          <BrowserFrame
            src={current.src}
            alt={current.label}
            label={current.label}
            callout={current.callout}
          />
        )}

        <div className="mt-6 p-6 rounded-3xl bg-slate-900/60 border border-white/10 max-w-3xl mx-auto text-center">
          <p className="text-slate-200 text-sm sm:text-base font-medium leading-relaxed">{current.desc}</p>
        </div>
      </div>
    </div>
  );
};


const ROICalculator: React.FC = () => {
  const [revenue, setRevenue] = useState(45000);
  const [leakage, setLeakage] = useState(5); // % de perda estimada

  const monthlySavings = Math.round(revenue * (leakage / 100));
  const yearlySavings = monthlySavings * 12;

  return (
    <div className="scroll-reveal p-8 md:p-12 rounded-[40px] bg-slate-900/60 border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-emerald-600/5 pointer-events-none"></div>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2 block">🍺 Calculadora do Ralo Invisível</span>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-4">
              Quanto dinheiro <span className="text-red-500 italic">escorre pelo ralo</span> do seu balcão todo mês?
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Duas long necks que saem sem anotar na correria de sexta, uma porção esquecida na comanda de papel, um troco errado às 2h da manhã e aquele fiado que nunca mais voltou. Parece troco de bala, mas no fim do ano dá o preço de uma reforma no bar.
            </p>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🍺 Boteco de Esquina (R$ 25k)', rev: 25000, leak: 5 },
              { label: '🍻 Bar Movimento (R$ 55k)', rev: 55000, leak: 6 },
              { label: '🔥 Casa Lotada (R$ 110k)', rev: 110000, leak: 6 },
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => { setRevenue(preset.rev); setLeakage(preset.leak); }}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  revenue === preset.rev
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20'
                    : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-white/25'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Faturamento Bruto do Mês</label>
                <span className="text-xl font-black text-white">R$ {revenue.toLocaleString('pt-BR')}</span>
              </div>
              <input 
                type="range" min="10000" max="200000" step="2500" 
                value={revenue} onChange={(e) => setRevenue(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Ralo Estimado (Esquecimento + Fiado + Quebra de Caixa)</label>
                <span className="text-xl font-black text-red-400">{leakage}%</span>
              </div>
              <input 
                type="range" min="1" max="15" step="1" 
                value={leakage} onChange={(e) => setLeakage(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic text-right">*Média real em bares no papel/planilha: 4% a 8%</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-950/80 p-8 md:p-10 rounded-3xl border border-emerald-500/20 flex flex-col items-center justify-center text-center relative shadow-2xl">
          <div className="absolute -top-4 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
            Dinheiro que Fica no Bolso
          </div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-3 mt-2">Estancando esse ralo você recupera</div>
          <div className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter mb-1">
            R$ {monthlySavings.toLocaleString('pt-BR')}
          </div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">todo santo mês</div>
          
          <div className="my-6 pt-6 border-t border-white/10 w-full">
            <div className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-1">
              R$ {yearlySavings.toLocaleString('pt-BR')}
            </div>
            <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">no seu bolso em 1 ano</div>
          </div>

          <a
            href="/?demo=true"
            className="w-full py-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-widest transition-all"
          >
            Ver como o caixa blindado funciona →
          </a>
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

const WhatsAppSimulation: React.FC = () => {
  const [zapMode, setZapMode] = useState<'turno' | 'pendura'>('turno');

  return (
    <div className="scroll-reveal max-w-md mx-auto bg-[#075e54]/10 rounded-[40px] p-6 sm:p-8 border border-[#25d366]/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-[#25d366]/10 to-transparent pointer-events-none"></div>

      {/* Mode Switcher */}
      <div className="relative z-10 grid grid-cols-2 gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/10 mb-6">
        <button
          onClick={() => setZapMode('turno')}
          className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            zapMode === 'turno'
              ? 'bg-[#25d366] text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📊 Resumo pro Sócio
        </button>
        <button
          onClick={() => setZapMode('pendura')}
          className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            zapMode === 'pendura'
              ? 'bg-[#25d366] text-slate-950 shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🤝 Cobrar Pendura
        </button>
      </div>
      
      {/* WhatsApp Header Mockup */}
      <div className="relative z-10 flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
        <div className="w-11 h-11 rounded-full bg-[#25d366] flex items-center justify-center text-slate-950 text-xl shadow-lg shadow-[#25d366]/20 font-black">
          {zapMode === 'turno' ? '📊' : '🍻'}
        </div>
        <div>
          <div className="text-xs font-black uppercase text-white tracking-wider">
            {zapMode === 'turno' ? 'Grupo dos Sócios • Bar do Galego' : 'Marcão (Freguês da Sexta)'}
          </div>
          <div className="text-[10px] text-[#25d366] font-bold uppercase tracking-widest flex items-center gap-1.5">
            {zapMode === 'turno' ? 'Fechamento de Caixa Automático' : 'Régua de Cobrança Sem Climão'}
          </div>
        </div>
      </div>

      {/* Messages */}
      {zapMode === 'turno' ? (
        <div className="relative z-10 space-y-5 animate-in fade-in duration-300">
          <div className="bg-[#1f2c34] p-5 rounded-2xl rounded-tl-none border border-white/10 max-w-[92%] shadow-xl">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
              *📊 RÉGUA PASSADA — FECHAMENTO DE TURNO* <br/><br/>
              📅 *Sexta-feira:* 01:40h <br/>
              👤 *Caixa:* Galego (Conferência Cega ✅) <br/><br/>
              💰 *Total Vendido:* R$ 4.890,00 <br/>
              🟢 *Pix:* R$ 2.410,00 | 💳 *Cartão:* R$ 1.830,00 <br/>
              💵 *Gaveta (Dinheiro):* R$ 650,00 _(Bateu cravado!)_ <br/>
              🍺 *Campeão da Noite:* Original 600ml (114 un) <br/>
              📈 *Ticket Médio:* R$ 108,60 (+14%)
            </p>
            <span className="text-[9px] text-slate-400 block mt-2 text-right">01:41</span>
          </div>

          <div className="bg-[#054740] p-4 rounded-2xl rounded-tr-none border border-[#25d366]/30 max-w-[88%] ml-auto shadow-xl">
            <p className="text-xs sm:text-sm text-white leading-relaxed font-bold italic">
              "Coisa linda! Gaveta batendo na vírgula e sexta que vem já sabemos que precisa pedir mais 10 caixas de Original 🍻"
            </p>
            <div className="flex justify-end items-center gap-1 mt-1.5">
              <span className="text-[9px] text-slate-300">01:42</span>
              <span className="text-[#34b7f1] text-xs">✓✓</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 space-y-5 animate-in fade-in duration-300">
          <div className="bg-[#054740] p-5 rounded-2xl rounded-tr-none border border-[#25d366]/30 max-w-[92%] ml-auto shadow-xl">
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-mono">
              Fala *Marcão*, beleza meu querido? 🍻<br/><br/>
              Passando só pra organizar o caderninho da semana aqui no *Bar do Galego*:<br/>
              • Quinta (02/11): 4x Heineken 600ml + 1x Panceta = *R$ 98,00*<br/><br/>
              Quando puder mandar naquele Pix da casa (*11966989160*), me dá um toque que já dou baixa aqui! Tamo junto! 👊
            </p>
            <div className="flex justify-end items-center gap-1 mt-1.5">
              <span className="text-[9px] text-slate-300">14:15</span>
              <span className="text-[#34b7f1] text-xs">✓✓</span>
            </div>
          </div>

          <div className="bg-[#1f2c34] p-4 rounded-2xl rounded-tl-none border border-white/10 max-w-[88%] shadow-xl">
            <p className="text-xs sm:text-sm text-white leading-relaxed font-bold italic">
              "Opa Galego! Ainda bem que mandou, tinha até esquecido de quinta. Acabei de fazer o Pix aí, guarda minha mesa hoje!"
            </p>
            <span className="text-[9px] text-slate-400 block mt-1.5 text-right">14:17</span>
          </div>
        </div>
      )}

      <div className="relative z-10 mt-6 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">
          ↑ Alterne acima para ver os 2 disparos automáticos em 1 clique
        </span>
      </div>
    </div>
  );
};

// ─── INTERACTIVE COCKTAIL LAB SHOWCASE ───
const CocktailLabShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'subrecipes' | 'waste' | 'zeroComplex'>('calculator');
  const [selectedDrinkKey, setSelectedDrinkKey] = useState<'negroni' | 'gintonic' | 'sour' | 'mule'>('negroni');
  const [sellingPrice, setSellingPrice] = useState<number>(36);
  const [monthlyVolume, setMonthlyVolume] = useState<number>(180);
  const [batchSimulated, setBatchSimulated] = useState<boolean>(false);
  const [unitMode, setUnitMode] = useState<'traditional' | 'cocktail'>('cocktail');

  const drinksData = {
    negroni: {
      name: 'Negroni Clássico',
      icon: '🍸',
      badge: 'Margem de Elite (Alta)',
      desc: 'Ícone da coquetelaria mundial com proporção equilibrada 1:1:1. O controle por mililitro elimina a perda oculta de doses livres no balcão.',
      defaultPrice: 36,
      ingredients: [
        { name: 'Gin London Dry', package: 'Garrafa 750ml (R$ 85,00)', dose: '30 ml', cost: 3.40 },
        { name: 'Vermute Rosso', package: 'Garrafa 750ml (R$ 55,00)', dose: '30 ml', cost: 2.20 },
        { name: 'Campari Bitter', package: 'Garrafa 900ml (R$ 68,00)', dose: '30 ml', cost: 2.27 },
        { name: 'Laranja Bahia & Gelo Cristal', package: 'Insumos Frescos', dose: '1 fatia + cubo', cost: 0.60 }
      ]
    },
    gintonic: {
      name: 'Gin Tônica Botânica',
      icon: '🌿',
      badge: 'Giro Rápido',
      desc: 'O mais consumido nas noites de casa cheia. Cada 15ml a mais servidos "no olho" pelo bartender queimam 18% do seu lucro líquido por garrafa.',
      defaultPrice: 38,
      ingredients: [
        { name: 'Gin Premium Botânico', package: 'Garrafa 750ml (R$ 95,00)', dose: '50 ml', cost: 6.33 },
        { name: 'Água Tônica Artesanal', package: 'Lata 200ml (R$ 4,50)', dose: '1 un (200ml)', cost: 4.50 },
        { name: 'Zimbro, Alecrim & Especiarias', package: 'Insumos Secos', dose: '1 porção', cost: 0.80 },
        { name: 'Gelo Cristal Transparente', package: 'Gelo Especial', dose: '1 copo', cost: 0.40 }
      ]
    },
    sour: {
      name: 'Whiskey Sour Artesanal',
      icon: '🥃',
      badge: 'Sub-preparo da Casa',
      desc: 'Combina Bourbon whiskey com Xarope Simples 2:1 produzido na própria cozinha, reduzindo o custo do açúcar e premix em mais de 65%.',
      defaultPrice: 42,
      ingredients: [
        { name: 'Bourbon Whiskey', package: 'Garrafa 750ml (R$ 130,00)', dose: '60 ml', cost: 10.40 },
        { name: 'Xarope Simples 2:1 (Sub-preparo)', package: 'Batch da Casa (R$ 4,50/L)', dose: '25 ml', cost: 0.11 },
        { name: 'Suco de Limão Siciliano', package: 'Kg Fresco (R$ 14,00/kg)', dose: '30 ml', cost: 0.84 },
        { name: 'Albumina & Angostura', package: 'Frascos Dosadores', dose: '3 gotas', cost: 0.65 }
      ]
    },
    mule: {
      name: 'Moscow Mule com Espuma',
      icon: '🍺',
      badge: 'Alto Valor Percebido',
      desc: 'A espuma de gengibre artesanal no sifão custa centavos no lote e transforma uma caneca de R$ 9,00 de custo em um ticket de R$ 39,00.',
      defaultPrice: 39,
      ingredients: [
        { name: 'Vodka Standard', package: 'Garrafa 1.000ml (R$ 65,00)', dose: '50 ml', cost: 3.25 },
        { name: 'Suco de Limão Tahiti', package: 'Kg Fresco (R$ 8,00/kg)', dose: '25 ml', cost: 0.50 },
        { name: 'Xarope de Gengibre (Sub-preparo)', package: 'Batch da Casa (R$ 8,50/L)', dose: '25 ml', cost: 0.21 },
        { name: 'Espuma de Gengibre (Sifão Batch)', package: 'Lote Sifão 1L (R$ 14,00)', dose: '1 dose', cost: 1.40 }
      ]
    }
  };

  const currentDrink = drinksData[selectedDrinkKey];
  const recipeCost = currentDrink.ingredients.reduce((acc, i) => acc + i.cost, 0);
  const grossProfit = Math.max(0, sellingPrice - recipeCost);
  const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const cmvPercent = sellingPrice > 0 ? (recipeCost / sellingPrice) * 100 : 0;
  const monthlyProfit = grossProfit * monthlyVolume;

  const targetPrice60 = Math.ceil(recipeCost / (1 - 0.60));
  const targetPrice70 = Math.ceil(recipeCost / (1 - 0.70));
  const targetPrice80 = Math.ceil(recipeCost / (1 - 0.80));

  const handleSelectDrink = (key: 'negroni' | 'gintonic' | 'sour' | 'mule') => {
    setSelectedDrinkKey(key);
    setSellingPrice(drinksData[key].defaultPrice);
  };

  return (
    <section id="coquetelaria" className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-[#020617] via-slate-950 to-[#020617]">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 scroll-reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <span>🍸</span> Módulo de Drinks & Insumos Fracionados 2.0
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
            O Lucro Real Mora na <span className="text-amber-400 italic">Coquetelaria</span>.
          </h2>
          <p className="mt-6 text-slate-300 text-lg max-w-2xl mx-auto">
            Vender cerveja de lata dá giro, mas o drink artesanal entrega margens de <strong className="text-white">75% a 85%</strong>. O Botequista calcula cada mililitro, gerencia batches caseiros e estanca o ralo invisível do seu balcão.
          </p>

          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { id: 'calculator', label: '🍹 Simulador de Ficha & CMV', icon: '📊' },
              { id: 'subrecipes', label: '🧪 Sub-preparos & Batches', icon: '⚡' },
              { id: 'waste', label: '🛡️ Prevenção de Perdas', icon: '🚨' },
              { id: 'zeroComplex', label: '⚙️ Princípio Zero Complexidade', icon: '✨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 scale-105'
                    : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:border-amber-500/30 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── TAB 1: CALCULATOR & REAL-TIME CMV ─── */}
        {activeTab === 'calculator' && (
          <div className="scroll-reveal bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-10 animate-in fade-in duration-500">
            {/* Drink Selector Pills */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 block mb-1">Escolha um Coquetel do Cardápio</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Simulação de Engenharia de Cardápio</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(drinksData) as (keyof typeof drinksData)[]).map((key) => {
                  const item = drinksData[key];
                  const isSelected = selectedDrinkKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectDrink(key)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-white text-slate-950 shadow-lg'
                          : 'bg-slate-950/60 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drink Details & Financial Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Ingredients breakdown */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{currentDrink.icon}</span>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase">{currentDrink.name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">{currentDrink.badge}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Custo Total (CMV)</span>
                    <span className="text-xl font-black text-amber-400">R$ {recipeCost.toFixed(2)}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed italic bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                  "{currentDrink.desc}"
                </p>

                {/* Ingredients List */}
                <div className="space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex justify-between">
                    <span>Insumo Fracionado</span>
                    <span>Dose & Custo na Taça</span>
                  </div>
                  {currentDrink.ingredients.map((ing, idx) => (
                    <div key={idx} className="bg-slate-950/50 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between hover:border-amber-500/20 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          {ing.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{ing.package}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-white">{ing.dose}</div>
                        <div className="text-[10px] font-bold text-amber-400">R$ {ing.cost.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target pricing buttons */}
                <div className="pt-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 flex items-center gap-1.5">
                    <span>🎯</span> Sugestão de Preço por Margem Alvo (1 Clique):
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSellingPrice(targetPrice60)}
                      className="p-3 bg-slate-950/70 border border-white/10 hover:border-amber-500/50 rounded-2xl text-center group transition-all"
                    >
                      <div className="text-[9px] font-black uppercase text-slate-400 group-hover:text-amber-400">Alvo 60%</div>
                      <div className="text-sm font-black text-white">R$ {targetPrice60},00</div>
                    </button>
                    <button
                      onClick={() => setSellingPrice(targetPrice70)}
                      className="p-3 bg-slate-950/70 border border-amber-500/30 hover:border-amber-400 rounded-2xl text-center group transition-all"
                    >
                      <div className="text-[9px] font-black uppercase text-amber-400">Alvo 70% (Top)</div>
                      <div className="text-sm font-black text-white">R$ {targetPrice70},00</div>
                    </button>
                    <button
                      onClick={() => setSellingPrice(targetPrice80)}
                      className="p-3 bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl text-center group transition-all"
                    >
                      <div className="text-[9px] font-black uppercase text-emerald-400">Alvo 80% (Master)</div>
                      <div className="text-sm font-black text-white">R$ {targetPrice80},00</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Financial HUD */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-white/10 p-6 md:p-8 rounded-3xl space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Preço de Venda Praticado
                    </label>
                    <span className="text-2xl font-black text-amber-400">R$ {sellingPrice},00</span>
                  </div>
                  <input
                    type="range"
                    min={Math.ceil(recipeCost) + 5}
                    max={75}
                    step={1}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-bold">
                    <span>Mín: R$ {Math.ceil(recipeCost) + 5}</span>
                    <span>Máx: R$ 75</span>
                  </div>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/5">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Lucro por Taça</div>
                    <div className="text-2xl font-black text-emerald-400">R$ {grossProfit.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-500 font-bold mt-0.5">líquido de produto</div>
                  </div>
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-white/5">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">CMV (%)</div>
                    <div className={`text-2xl font-black ${cmvPercent <= 25 ? 'text-emerald-400' : cmvPercent <= 35 ? 'text-amber-400' : 'text-red-400'}`}>
                      {cmvPercent.toFixed(1)}%
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold mt-0.5">
                      {cmvPercent <= 25 ? '🟢 Excelente' : cmvPercent <= 35 ? '🟡 Saudável' : '🔴 Crítico'}
                    </div>
                  </div>
                </div>

                {/* Margin Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Margem Bruta</span>
                    <span className="text-emerald-400">{marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, marginPercent))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Monthly Volume Simulator */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Volume Mensal Vendido</span>
                    <span className="text-sm font-black text-white">{monthlyVolume} drinks</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={600}
                    step={10}
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-center">
                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                      Lucro Líquido Real no Seu Bolso / Mês
                    </div>
                    <div className="text-3xl font-black text-emerald-400 tracking-tight">
                      R$ {monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">Gerado exclusivamente com {currentDrink.name}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SUB-RECIPES & BATCH PRODUCTION ─── */}
        {activeTab === 'subrecipes' && (
          <div className="scroll-reveal bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-10 animate-in fade-in duration-500">
            <div className="max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 block mb-2">Engenharia de Pré-Preparo</span>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">
                Sub-preparos & Produção de Batches com <span className="text-amber-400">1 Clique</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Comprar xarope industrializado pronto custa R$ 50,00 o litro. Fazer no seu bar custa R$ 4,50. 
                O Botequista calcula os insumos básicos, dá baixa no estoque e cria o produto artesanal com lote, custo exato e validade refrigerada.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Batch card */}
              <div className="bg-slate-950/80 border border-white/10 p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">🍯</div>
                    <div>
                      <h4 className="text-base font-black text-white uppercase">Xarope Simples 2:1 Artesanal</h4>
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Receita de Sub-preparo</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                    Rendimento: 1.200 ml
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insumos Necessários por Lote:</div>
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-300">Açúcar Cristal Refinado</span>
                    <span className="font-bold text-white">800 g <span className="text-slate-500 font-normal">(R$ 3,60)</span></span>
                  </div>
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                    <span className="text-slate-300">Água Filtrada Mineral</span>
                    <span className="font-bold text-white">500 ml <span className="text-slate-500 font-normal">(R$ 0,50)</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-slate-400">Custo Total de Produção:</span>
                  <span className="font-black text-amber-400 text-base">R$ 4,10 / litro</span>
                </div>

                <button
                  onClick={() => setBatchSimulated(!batchSimulated)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>{batchSimulated ? 'Lote Produzido! (Clique para resetar)' : 'Simular Ordem de Produção de Lote'}</span>
                </button>
              </div>

              {/* Simulation Result */}
              <div className="space-y-4">
                {batchSimulated ? (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-8 rounded-3xl space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 text-emerald-400">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-xl">✅</div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-widest">Ordem de Produção Executada</div>
                        <div className="text-[10px] text-slate-400">Movimentação instantânea no estoque</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-red-400">
                        <span>🔻</span>
                        <span>Baixa automática: <strong>800g de Açúcar</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400">
                        <span>🔻</span>
                        <span>Baixa automática: <strong>500ml de Água</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <span>📦</span>
                        <span>Entrada de estoque: <strong>+1.200ml de Xarope Simples 2:1</strong></span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Etiqueta & Validade do Lote</div>
                      <div className="text-xs font-mono text-amber-400 font-bold">LOTE #089 • Custo: R$ 0,0034 / ml</div>
                      <div className="text-[11px] text-slate-300">Validade: 15 dias refrigerado • <span className="text-emerald-400 font-bold">Ativo e Fresco (14 dias restantes)</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 text-center space-y-3">
                    <div className="text-4xl opacity-40">🧪</div>
                    <h5 className="text-sm font-black uppercase text-slate-300 tracking-wider">Aperte o botão para simular</h5>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                      Veja na prática como o sistema desconta os grãos de açúcar e garrafas de base e registra o produto acabado pronto para uso nos coquetéis.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="text-amber-400 text-xl font-black mb-1">-70%</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Custo de Xaropes & Infusões</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
                    <div className="text-emerald-400 text-xl font-black mb-1">Zero</div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Lotes Vencidos Esquecidos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: WASTE PREVENTION & CRITICAL AUDIT ─── */}
        {activeTab === 'waste' && (
          <div className="scroll-reveal bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-10 animate-in fade-in duration-500">
            <div className="max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 block mb-2">Proteção de Margem & Auditoria</span>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">
                O Furo Misterioso de <span className="text-red-500">Inventário</span> Acabou
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Em bares sem controle de coquetelaria, <strong className="text-white">8% a 15% das garrafas evaporam</strong> em doses desreguladas, quebra de garrafas no gelo e sobras de coqueteleira descartadas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Scenario Without */}
              <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3 text-red-400">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-xl">❌</div>
                  <div>
                    <h4 className="text-base font-black uppercase">No Bar Tradicional (Sem Botequista)</h4>
                    <span className="text-[9px] text-red-400/80 font-bold uppercase">Prejuízo Invisível</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black">✕</span>
                    <span>O bartender despeja 70ml ao invés de 50ml na correria: <strong>4 drinks a menos por garrafa</strong> de whisky ou gin.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black">✕</span>
                    <span>Uma garrafa de licor importado de R$ 180,00 cai no chão e quebra: ninguém anota, vira "furo de estoque".</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-black">✕</span>
                    <span>Xarope de morango artesanal azeda na geladeira porque ninguém sabe quando foi preparado.</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-red-500/20 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block mb-1">Perda Média Estimada</span>
                  <span className="text-3xl font-black text-red-500">R$ 2.800,00 / mês</span>
                </div>
              </div>

              {/* Scenario With Botequista */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl">🛡️</div>
                  <div>
                    <h4 className="text-base font-black uppercase">Com o Botequista Drinks 2.0</h4>
                    <span className="text-[9px] text-emerald-400/80 font-bold uppercase">Blindagem Financeira</span>
                  </div>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span><strong>Baixa Atômica Fracionada:</strong> cada drink lançado no PDV abate exatamente os ml correspondentes no estoque de insumos.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span><strong>Registro de Perda em 2 Toques:</strong> selecione a garrafa, o motivo (quebra, sobra, vencimento) e o sistema calcula o valor em R$ do prejuízo.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span><strong>Radar de Validade:</strong> alertas visuais de lotes refrigerados garantem que tudo seja utilizado antes de estragar.</span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-emerald-500/20 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-1">Economia Preservada</span>
                  <span className="text-3xl font-black text-emerald-400">+ R$ 33.600,00 / ano</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: ZERO COMPLEXITY PRINCIPLE ─── */}
        {activeTab === 'zeroComplex' && (
          <div className="scroll-reveal bg-slate-900/60 backdrop-blur-xl border border-amber-500/20 rounded-[40px] p-8 md:p-12 shadow-2xl space-y-10 animate-in fade-in duration-500">
            <div className="max-w-3xl">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 block mb-2">Princípio Zero Complexidade</span>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">
                Ative Apenas se <span className="text-amber-400">Fizer Sentido</span> para Sua Operação
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Você gerencia um boteco raiz focado em cerveja de garrafa, pastel e chopp? Você <strong>não vê nenhum campo extra</strong>, nenhuma aba de coquetelaria e nenhum cálculo desnecessário. Tem uma unidade de coquetelaria? Ative em 1 clique em Ajustes.
              </p>
            </div>

            {/* Interactive Unit Switcher Preview */}
            <div className="bg-slate-950/80 border border-white/10 p-6 md:p-8 rounded-3xl space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Simule a Configuração de Unidade:</div>
                  <div className="text-lg font-black text-white uppercase mt-0.5">Configurável por Filial / Bar</div>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-white/5">
                  <button
                    onClick={() => setUnitMode('traditional')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                      unitMode === 'traditional'
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍺 Boteco Tradicional
                  </button>
                  <button
                    onClick={() => setUnitMode('cocktail')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                      unitMode === 'cocktail'
                        ? 'bg-amber-500 text-slate-950 shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍸 Bar de Coquetelaria
                  </button>
                </div>
              </div>

              {/* Dynamic Mock View */}
              {unitMode === 'traditional' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Modo Simples (Zero Complexidade): Telas 100% limpas</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Barra Lateral</div>
                      <div className="text-sm font-bold text-white">PDV, Comandas, Estoque, Caixa</div>
                      <div className="text-[10px] text-slate-500">O menu "Drinks & Bar" fica totalmente oculto.</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cadastro de Produtos</div>
                      <div className="text-sm font-bold text-white">Nome, Preço de Custo, Venda e Quantidade</div>
                      <div className="text-[10px] text-slate-500">Zero campos de volume, mililitros ou receitas.</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Velocidade no Caixa</div>
                      <div className="text-sm font-bold text-emerald-400">100% Direto ao Ponto</div>
                      <div className="text-[10px] text-slate-500">Giro ultrarrápido sem burocracia.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                    <span>Módulo de Drinks Ativado: Poder de Gestão Completo</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">Barra Lateral</div>
                      <div className="text-sm font-bold text-white">🍹 Hub de Coquetelaria Liberado</div>
                      <div className="text-[10px] text-slate-400">Acesso a Engenharia de Cardápio, Batches e Perdas.</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">Fichas & Insumos</div>
                      <div className="text-sm font-bold text-white">Garrafa ➔ Custo por Dose (50ml)</div>
                      <div className="text-[10px] text-slate-400">Conversor automático e sugestão de preço alvo ao vivo.</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20 space-y-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-amber-400">Controle de Batches</div>
                      <div className="text-sm font-bold text-white">Xaropes, Premixes e Validades</div>
                      <div className="text-[10px] text-slate-400">Ordens de produção com 1 clique e baixa de ingredientes.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// ─── INTERACTIVE TECH SECTION ───
const TechSection: React.FC<{ onOpenDiagnostics: () => void }> = ({ onOpenDiagnostics }) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'rateLimit' | 'sandbox' | 'rbac'>('sync');

  // ─── 1. SYNCHRONIZATION ENGINE STATE ───
  const [isOnline, setIsOnline] = useState(true);
  const [localQueue, setLocalQueue] = useState<{ id: string; type: string; name: string; price: number }[]>([]);
  const [cloudDb, setCloudDb] = useState<{ id: string; type: string; name: string; price: number }[]>([
    { id: 'v_e489', type: 'venda', name: 'Cerveja Duplo Malte', price: 12 },
    { id: 'v_c230', type: 'venda', name: 'Porção de Batata Frita', price: 38 },
  ]);
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'SYSTEM: [02:50:00] Dispositivo inicializado com sucesso.',
    'SYNC: [02:50:01] Sincronização atômica estabelecida com Firebase RTDB.',
    'CACHE: [02:50:01] 0 transações pendentes no IndexedDB (latência zero).'
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Scroll sync logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [syncLogs]);

  const handleSimulateSale = (itemName: string, price: number) => {
    const saleId = `v_${Math.random().toString(36).substring(2, 6)}`;
    const newSale = { id: saleId, type: 'venda', name: itemName, price };

    if (!isOnline) {
      setLocalQueue(prev => [...prev, newSale]);
      setSyncLogs(prev => [
        ...prev,
        `CACHE: [${new Date().toLocaleTimeString()}] OFFLINE: Venda de "${itemName}" (R$ ${price}) gravada no IndexedDB em 2.4ms (Offline-First).`
      ]);
    } else {
      setCloudDb(prev => [...prev, newSale]);
      setSyncLogs(prev => [
        ...prev,
        `SYNC: [${new Date().toLocaleTimeString()}] ONLINE: Venda de "${itemName}" (R$ ${price}) transmitida diretamente ao Firebase.`
      ]);
    }
  };

  const handleSyncQueue = () => {
    if (localQueue.length === 0) {
      setSyncLogs(prev => [...prev, `SYNC: [${new Date().toLocaleTimeString()}] Fila local limpa. Nada para sincronizar.`]);
      return;
    }

    setSyncLogs(prev => [
      ...prev,
      `SYNC: [${new Date().toLocaleTimeString()}] Iniciando upload de ${localQueue.length} transações pendentes...`,
      `SYNC: [${new Date().toLocaleTimeString()}] Canal TLS 1.3 estabelecido com a Nuvem Google.`
    ]);

    setTimeout(() => {
      setCloudDb(prev => [...prev, ...localQueue]);
      setSyncLogs(prev => [
        ...prev,
        `SYNC: [${new Date().toLocaleTimeString()}] Sincronização atômica concluída! ${localQueue.length} comanda(s) gravadas no Firebase RTDB.`,
        `CACHE: [${new Date().toLocaleTimeString()}] Cache do IndexedDB liberado.`
      ]);
      setLocalQueue([]);
    }, 1200);
  };

  // ─── 2. RATE LIMIT STATE ───
  const [rateLogs, setRateLogs] = useState<{ id: number; path: string; status: number; time: string; delay: number }[]>([]);
  const [remainingLimit, setRemainingLimit] = useState(30);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [rateCooldown, setRateCooldown] = useState(0);
  const [recentClicks, setRecentClicks] = useState<number[]>([]);

  // Cooldown countdown
  useEffect(() => {
    if (blockedUntil !== null) {
      const interval = setInterval(() => {
        const diff = Math.max(0, Math.ceil((blockedUntil - Date.now()) / 1000));
        setRateCooldown(diff);
        if (diff === 0) {
          setBlockedUntil(null);
          setRemainingLimit(30);
          setRecentClicks([]);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockedUntil]);

  const handleRateLimitRequest = (path: string) => {
    if (blockedUntil !== null) return;

    const now = Date.now();
    const newClicks = [...recentClicks, now].filter(t => now - t < 3000);
    setRecentClicks(newClicks);

    let status = 200;
    const remaining = Math.max(0, remainingLimit - 1);
    setRemainingLimit(remaining);

    // Block if clicks are too fast (more than 5 in 3 seconds) or limit is 0
    if (newClicks.length > 5 || remaining === 0) {
      status = 429;
      setBlockedUntil(now + 10000); // 10s cooldown for simulation
      setRateCooldown(10);
      setRateLogs(prev => [
        { id: prev.length + 1, path, status, time: new Date().toLocaleTimeString(), delay: 1.8 },
        ...prev
      ]);
      return;
    }

    setRateLogs(prev => [
      { id: prev.length + 1, path, status, time: new Date().toLocaleTimeString(), delay: Math.floor(Math.random() * 12) + 4 },
      ...prev
    ]);
  };

  // ─── 3. SANDBOX STORAGE STATE ───
  const [storageKeys, setStorageKeys] = useState<{ key: string; value: string; isProtected: boolean }[]>([
    { key: 'btq_active_unit', value: 'Unidade_Vila_Mada', isProtected: true },
    { key: 'btq_session_token', value: 'JWT_eYjhbGciOiJIUzI1NiIsInR5c...', isProtected: true },
    { key: 'btq_cached_products', value: '57_itens_cadastrados', isProtected: true },
    { key: 'theme', value: 'dark', isProtected: false },
    { key: 'user_preferred_zoom', value: '110%', isProtected: false },
  ]);
  const [storageActionLog, setStorageActionLog] = useState<string>('Aguardando gravação de chave no Sandbox...');

  const handleAddStorageItem = (rawKey: string, val: string) => {
    const isSensitive = ['session', 'token', 'unit', 'sales', 'cache', 'products', 'admin', 'user'].some(word => rawKey.toLowerCase().includes(word));
    const processedKey = isSensitive && !rawKey.startsWith('btq_') ? `btq_${rawKey}` : rawKey;

    setStorageKeys(prev => {
      const filtered = prev.filter(item => item.key !== processedKey);
      return [{ key: processedKey, value: val, isProtected: isSensitive }, ...filtered];
    });

    setStorageActionLog(
      isSensitive 
        ? `SISTEMA: safeLocalStorage interceptou gravação de "${rawKey}". Detectado dado sensível. Chave redirecionada transparentemente para o sandbox protegido como "${processedKey}".`
        : `SISTEMA: safeLocalStorage gravou "${rawKey}" diretamente. Chave utilitária livre de prefixação.`
    );
  };

  // ─── 4. CENTRALIZED RBAC STATE ───
  const [selectedRole, setSelectedRole] = useState<'admin' | 'caixa' | 'garcom' | 'cozinha'>('admin');

  return (
    <section id="tech-console" className="py-32 px-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.02)_0%,transparent_60%)]"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Arquitetura & Segurança v5.5.0
          </span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
            Engenharia de Borda & <span className="text-emerald-500 italic">Conectividade</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Interaja diretamente com o console técnico real do Botequista. Veja em tempo real nossas soluções de segurança ativa, rate limiting e resiliência offline.
          </p>
        </div>

        {/* Console Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Tab Sidebar */}
          <div className="lg:col-span-3 flex flex-col gap-2.5">
            {[
              { id: 'sync', title: 'Sincronismo Atômico', desc: 'SyncQueue e Cache Offline-First', icon: '🔄' },
              { id: 'rateLimit', title: 'Edge Rate Limiting', desc: 'Proteção contra DoS / Raspagem', icon: '🛡️' },
              { id: 'sandbox', title: 'Sandbox Storage', desc: 'safeLocalStorage isolado', icon: '📦' },
              { id: 'rbac', title: 'Blindagem de Admin', desc: 'useIsAdmin() & Route Guard', icon: '🔐' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                  activeTab === tab.id
                    ? 'bg-[#0b1328]/80 border-emerald-500/30 text-white shadow-lg shadow-emerald-900/10 glow-pulse'
                    : 'bg-slate-900/30 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xl ${activeTab === tab.id ? 'scale-110 rotate-12' : ''} transition-transform`}>{tab.icon}</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">{tab.title}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{tab.desc}</p>
                  </div>
                </div>
              </button>
            ))}

            {/* Diagnostics Link card */}
            <button
              onClick={onOpenDiagnostics}
              className="mt-6 w-full p-5 rounded-2xl bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/20 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Diagnóstico Geral</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Executar Auditoria de Borda CLI</p>
                </div>
                <span className="text-lg group-hover:translate-x-1 transition-transform">⚡</span>
              </div>
            </button>
          </div>

          {/* Interactive Output Console */}
          <div className="lg:col-span-9 rounded-3xl bg-[#070b19]/90 border border-white/5 overflow-hidden flex flex-col relative shadow-2xl">
            <div className="scanline"></div>
            
            {/* Terminal Header */}
            <div className="bg-slate-900/60 p-4 border-b border-white/5 flex justify-between items-center relative z-20">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                  engine@botequista:~/{activeTab}_simulator
                </span>
              </div>
              <span className="text-[8px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                status: active_sandbox
              </span>
            </div>

            {/* Console Content */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col relative z-20 overflow-y-auto no-scrollbar">
              
              {/* TAB 1: SYNCHRONIZATION ENGINE */}
              {activeTab === 'sync' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-base font-black uppercase tracking-wider mb-2">🔄 Sincronismo Atômico & Fila Local Híbrida</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                      O sistema detecta a perda de sinal instantaneamente. Quando OFFLINE, os dados são salvos no IndexedDB local do garçom em 2.4ms. Ao retornar ONLINE, o Botequista sincroniza a fila acumulada atomicamente para evitar conflitos de mesas concorrentes.
                    </p>

                    {/* Simulation Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Canal de Rede</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsOnline(true);
                              setSyncLogs(prev => [...prev, `SYNC: [${new Date().toLocaleTimeString()}] Rede restaurada. Canal ONLINE ativo.`]);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                              isOnline ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'
                            }`}
                          >
                            Online
                          </button>
                          <button
                            onClick={() => {
                              setIsOnline(false);
                              setSyncLogs(prev => [...prev, `SYNC: [${new Date().toLocaleTimeString()}] Rede desconectada pelo usuário. Canal em modo OFFLINE-FIRST.`]);
                            }}
                            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                              !isOnline ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-500 hover:text-white'
                            }`}
                          >
                            Offline
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Simular Lançamentos</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSimulateSale('Chopp IPA 500ml', 16)}
                            className="flex-1 py-1.5 rounded-lg bg-[#111833] border border-white/10 text-[9px] font-black uppercase text-white hover:border-emerald-500/40 hover:bg-[#152044] transition-all"
                          >
                            + Chopp
                          </button>
                          <button
                            onClick={() => handleSimulateSale('Porção Pastéis', 42)}
                            className="flex-1 py-1.5 rounded-lg bg-[#111833] border border-white/10 text-[9px] font-black uppercase text-white hover:border-emerald-500/40 hover:bg-[#152044] transition-all"
                          >
                            + Pastéis
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ação do Sync</span>
                        <button
                          onClick={handleSyncQueue}
                          disabled={localQueue.length === 0}
                          className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            localQueue.length > 0
                              ? 'bg-emerald-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20'
                              : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          Sincronizar ({localQueue.length})
                        </button>
                      </div>
                    </div>

                    {/* Sync Engine Visual Map */}
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center bg-[#050813] p-5 rounded-2xl border border-white/5 mb-6">
                      
                      {/* Local Client Device */}
                      <div className="md:col-span-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-1.5 relative">
                        <span className="text-2xl">📱</span>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">IndexedDB (Local)</div>
                        <div className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                          Fila Local: {localQueue.length} comandas
                        </div>
                      </div>

                      {/* Connection path */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center text-center py-2">
                        {isOnline ? (
                          <div className="w-full px-4 flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-emerald-500 tracking-wider uppercase animate-pulse">Online • Canal Seguro</span>
                            <div className="w-full h-1 bg-emerald-500/20 rounded-full overflow-hidden relative">
                              <div className="absolute inset-y-0 w-1/3 bg-emerald-500 rounded-full animate-[grow_1.5s_ease-in-out_infinite]"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full px-4 flex flex-col items-center gap-1">
                            <span className="text-[8px] font-black text-amber-500 tracking-wider uppercase">Offline • Sincronismo Retido</span>
                            <div className="w-full h-1 bg-amber-500/25 rounded-full border border-dashed border-amber-500/40"></div>
                          </div>
                        )}
                      </div>

                      {/* Remote Firebase Database */}
                      <div className="md:col-span-2 p-3 bg-slate-900/60 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-1.5">
                        <span className="text-2xl">☁️</span>
                        <div className="text-[9px] font-black text-white uppercase tracking-widest">Firebase Cloud</div>
                        <div className="text-[8px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold">
                          Cloud DB: {cloudDb.length} itens
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Terminal Console Output */}
                  <div className="bg-[#03060c] p-4 rounded-xl border border-white/5 font-mono text-[9px] text-emerald-400/90 h-32 overflow-y-auto space-y-1.5 no-scrollbar shadow-inner">
                    {syncLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed whitespace-pre-wrap">
                        <span className="text-emerald-600/70 select-none">&gt;</span> {log}
                      </div>
                    ))}
                    <div ref={logsEndRef}></div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDGE API RATE LIMITING */}
              {activeTab === 'rateLimit' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-base font-black uppercase tracking-wider mb-2">🛡️ Proteção de Borda & Edge Rate Limiting</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                      Para mitigar ataques de força bruta, scripts de scraping ou robôs inflando comandas, nossa API enforca um controle de frequência atômico (limite de 30 requisições/min). Abusos retornam HTTP 429 com cabeçalhos padrão RFC.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                      {/* Controller & Clicker */}
                      <div className="md:col-span-5 bg-slate-950/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Simulador de Ataque</span>
                          <p className="text-[10px] text-slate-400 font-bold leading-normal">
                            Clique rapidamente no botão abaixo para simular disparos concorrentes contra a API do bar.
                          </p>
                        </div>

                        <button
                          onClick={() => handleRateLimitRequest('/api/reports')}
                          disabled={blockedUntil !== null}
                          className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            blockedUntil !== null
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-red-900/20'
                          }`}
                        >
                          {blockedUntil !== null ? `BLOQUEADO (${rateCooldown}s)` : 'Disparar GET /api/reports'}
                        </button>
                      </div>

                      {/* Header values output */}
                      <div className="md:col-span-7 bg-[#050813] p-5 rounded-2xl border border-white/5 font-mono text-[9px] text-slate-400 space-y-2.5">
                        <span className="text-[8px] font-sans font-black text-slate-500 uppercase tracking-widest block mb-1">
                          Cabeçalhos da Resposta HTTP (Live)
                        </span>
                        
                        <div className="grid grid-cols-12 gap-1 py-1 border-b border-white/5">
                          <span className="col-span-5 text-white font-bold">HTTP/1.1</span>
                          <span className={`col-span-7 font-black ${blockedUntil !== null ? 'text-red-500' : 'text-emerald-500'}`}>
                            {blockedUntil !== null ? '429 Too Many Requests' : '200 OK'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-12 gap-1 py-1 border-b border-white/5">
                          <span className="col-span-5 text-slate-400">content-type:</span>
                          <span className="col-span-7 text-white font-semibold">application/json</span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 py-1 border-b border-white/5">
                          <span className="col-span-5 text-slate-400">x-ratelimit-limit:</span>
                          <span className="col-span-7 text-white font-semibold">30</span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 py-1 border-b border-white/5">
                          <span className="col-span-5 text-slate-400">x-ratelimit-remaining:</span>
                          <span className={`col-span-7 font-bold ${remainingLimit < 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {remainingLimit}
                          </span>
                        </div>

                        <div className="grid grid-cols-12 gap-1 py-1 border-b border-white/5">
                          <span className="col-span-5 text-slate-400">x-ratelimit-reset:</span>
                          <span className="col-span-7 text-white font-semibold">{blockedUntil !== null ? `${rateCooldown}s` : '0s'}</span>
                        </div>

                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 text-slate-400">retry-after:</span>
                          <span className={`col-span-7 font-black ${blockedUntil !== null ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                            {blockedUntil !== null ? `${rateCooldown}s` : '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terminal Request Log */}
                  <div className="bg-[#03060c] rounded-xl border border-white/5 h-32 overflow-y-auto no-scrollbar shadow-inner">
                    {rateLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest italic">
                        Nenhuma requisição disparada nas últimas 3s
                      </div>
                    ) : (
                      <div className="p-4 font-mono text-[9px] space-y-1.5">
                        {rateLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex justify-between items-center py-0.5 px-2 rounded ${
                              log.status === 429 ? 'bg-red-500/10 text-red-400 border border-red-500/25 animate-pulse' : 'text-emerald-400/90'
                            }`}
                          >
                            <span>
                              [{log.time}] GET {log.path} - HTTP {log.status}
                            </span>
                            <span className="text-slate-500 font-bold uppercase">
                              {log.status === 429 ? 'Rate Limit Exceeded' : `latência: ${log.delay}ms`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SANDBOX LOCAL STORAGE */}
              {activeTab === 'sandbox' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-base font-black uppercase tracking-wider mb-2">📦 Sandboxing de Storage & safeLocalStorage</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                      Para evitar colisões com variáveis de outros sites no navegador ou interceptação maliciosa, o Botequista implementa um wrapper chamado `safeLocalStorage`. Chaves sensíveis (como tokens de autenticação e cache de faturamento) recebem um namespace fixo `btq_` isolado.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
                      
                      {/* Controller Form */}
                      <div className="md:col-span-5 bg-slate-950/60 p-4 rounded-xl border border-white/5 flex flex-col gap-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                          Simular Chamadas ao LocalStorage
                        </span>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Selecione uma chave:</label>
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              onClick={() => handleAddStorageItem('session_token', 'JWT_a78c1b9...') }
                              className="py-1.5 px-3 rounded-lg bg-[#111833] border border-white/5 text-[9px] font-black uppercase text-slate-200 text-left hover:border-emerald-500/40 hover:bg-[#152044] transition-all flex justify-between items-center"
                            >
                              <span>session_token</span>
                              <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">sensível</span>
                            </button>
                            <button
                              onClick={() => handleAddStorageItem('sales_cache', '124_vendas_fila') }
                              className="py-1.5 px-3 rounded-lg bg-[#111833] border border-white/5 text-[9px] font-black uppercase text-slate-200 text-left hover:border-emerald-500/40 hover:bg-[#152044] transition-all flex justify-between items-center"
                            >
                              <span>sales_cache</span>
                              <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">sensível</span>
                            </button>
                            <button
                              onClick={() => handleAddStorageItem('theme', 'dark_mode') }
                              className="py-1.5 px-3 rounded-lg bg-[#111833] border border-white/5 text-[9px] font-black uppercase text-slate-200 text-left hover:border-emerald-500/40 hover:bg-[#152044] transition-all flex justify-between items-center"
                            >
                              <span>theme</span>
                              <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">genérico</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Storage Partition Table */}
                      <div className="md:col-span-7 bg-[#050813] p-5 rounded-2xl border border-white/5 flex flex-col gap-3 font-mono text-[9px]">
                        <span className="text-[8px] font-sans font-black text-slate-500 uppercase tracking-widest block">
                          Estado das Partições no Navegador (Live)
                        </span>

                        <div className="flex-1 space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                          {storageKeys.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex justify-between items-center p-2 rounded border ${
                                item.isProtected
                                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                                  : 'bg-slate-900/40 border-white/5 text-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>{item.isProtected ? '🔒' : '🔓'}</span>
                                <span className="font-bold">{item.key}</span>
                              </div>
                              <span className="text-[8px] opacity-75 truncate max-w-[120px]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Engine storage log */}
                  <div className="bg-[#03060c] p-4 rounded-xl border border-white/5 font-mono text-[9px] text-emerald-400/90 leading-relaxed min-h-16 flex items-center shadow-inner">
                    <span className="text-emerald-600/70 mr-1.5 select-none font-bold">&gt;</span> {storageActionLog}
                  </div>
                </div>
              )}

              {/* TAB 4: CENTRALIZED RBAC */}
              {activeTab === 'rbac' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-base font-black uppercase tracking-wider mb-2">🔐 Central de Privilégios & useIsAdmin() Blindage</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
                      Evitamos validações locais dispersas e vulneráveis a adulteração manual. Criamos o `AuthContext` e centralizamos a blindagem no hook customizado `useIsAdmin()`. Troque o perfil de equipe no simulador para ver as restrições em tempo real.
                    </p>

                    {/* Role selector panel */}
                    <div className="flex gap-2 mb-6 flex-wrap">
                      {[
                        { id: 'admin', label: '👑 Administrador', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { id: 'caixa', label: '💰 Caixa', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                        { id: 'garcom', label: '📋 Garçom', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { id: 'cozinha', label: '🍳 Cozinheiro', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                      ].map(role => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id as any)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                            selectedRole === role.id
                              ? 'bg-white text-slate-950 font-black scale-105 border-white shadow-lg'
                              : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>

                    {/* Mock Interface showing route blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#050813] p-5 rounded-2xl border border-white/5">
                      
                      {/* Action 1: PDV Vendas */}
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-24">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block">1. Frente de Caixa & Vendas</span>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-[8px] text-emerald-400 font-bold uppercase">PDV Disponível</span>
                          <span className="text-xs">🟢</span>
                        </div>
                      </div>

                      {/* Action 2: Kitchen monitor */}
                      <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-24">
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block">2. Monitor de Cozinha Touch</span>
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-[8px] text-emerald-400 font-bold uppercase">Display Disponível</span>
                          <span className="text-xs">🟢</span>
                        </div>
                      </div>

                      {/* Action 3: Finance reports (Admin-only) */}
                      <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between min-h-24 transition-all duration-500 ${
                        selectedRole === 'admin' 
                          ? 'bg-slate-900/60 border-white/5' 
                          : 'bg-slate-950/40 border-red-500/10'
                      }`}>
                        {selectedRole !== 'admin' && (
                          <div className="absolute inset-0 bg-[#02050c]/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-3">
                            <span className="text-sm mb-1">🔐</span>
                            <span className="text-[8px] font-mono text-red-500 font-black uppercase tracking-widest leading-none">
                              Acesso Negado (useIsAdmin)
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block relative z-0">
                          3. Relatórios Financeiros (CMV)
                        </span>
                        <div className="flex justify-between items-center mt-4 relative z-0">
                          <span className="text-[8px] text-emerald-400 font-bold uppercase">Lucro Real Ativo</span>
                          <span className="text-xs">🟢</span>
                        </div>
                      </div>

                      {/* Action 4: Settings (Admin-only) */}
                      <div className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between min-h-24 transition-all duration-500 ${
                        selectedRole === 'admin' 
                          ? 'bg-slate-900/60 border-white/5' 
                          : 'bg-slate-950/40 border-red-500/10'
                      }`}>
                        {selectedRole !== 'admin' && (
                          <div className="absolute inset-0 bg-[#02050c]/90 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-3">
                            <span className="text-sm mb-1">🔐</span>
                            <span className="text-[8px] font-mono text-red-500 font-black uppercase tracking-widest leading-none">
                              Acesso Negado (useIsAdmin)
                            </span>
                          </div>
                        )}
                        <span className="text-[10px] font-black text-white uppercase tracking-wider block relative z-0">
                          4. Nível de Acesso da Equipe
                        </span>
                        <div className="flex justify-between items-center mt-4 relative z-0">
                          <span className="text-[8px] text-emerald-400 font-bold uppercase">RBAC Habilitado</span>
                          <span className="text-xs">🟢</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* RBAC verification readout */}
                  <div className="bg-[#03060c] p-4 rounded-xl border border-white/5 font-mono text-[9px] leading-relaxed shadow-inner">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">STATUS DA AUTENTICAÇÃO ATUAL:</span>
                      <span className={`font-black ${selectedRole === 'admin' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
                        {selectedRole === 'admin' ? 'PRIVILÉGIOS TOTAIS (ADMIN)' : 'OPERADOR RESTRITO'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Terminal Footer */}
            <div className="bg-slate-950 p-4 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-500 tracking-widest relative z-20">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> CONEXÃO_OK</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> BD_SEGURO</span>
              </div>
              <div>BOTEQUISTA_SECURITY_v5.5.0</div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

// ─── MAIN COMPONENT ───
export const LandingPage2: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [nerdTab, setNerdTab] = useState<'stack' | 'sync' | 'perf' | 'sec'>('stack');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [isTechConsoleModalOpen, setIsTechConsoleModalOpen] = useState(false);
  const [activePillar, setActivePillar] = useState<'salao' | 'gaveta' | 'cozinha' | 'dono'>('salao');

  const faqs = [
    { q: 'Qual é a pegadinha? É na faixa mesmo?', a: 'Papo reto: zero mensalidade, zero contrato de fidelidade e não pede cartão de crédito. Os primeiros bares parceiros que entrarem com a gente têm acesso vitalício na faixa em troca de feedback real de balcão.' },
    { q: 'E se a internet cair na sexta-feira às 21h?', a: 'O bar nem pisca. Toda venda e comanda fica gravada na hora na memória do aparelho (celular, tablet ou PC). Quando o Wi-Fi ou 4G voltar, o sistema sobe tudo pra nuvem sozinho, sem perder uma jujuba.' },
    { q: 'Preciso comprar computador novo ou maquininha cara?', a: 'Nada disso. Roda direto no navegador daquele celular Android, tablet ou notebook que já fica no caixa. Se quiser, você instala na tela inicial com 1 clique igual aplicativo.' },
    { q: 'Quanto tempo demora pra botar pra rodar?', a: 'O tempo de tomar um café: 15 minutos. Você cadastra as brejas, porções e doses (ou a gente te ajuda pelo Zap) e já abre o turno.' },
    { q: 'Meus garçons vão apanhar pra aprender?', a: 'Zero chance. A tela foi feita pra quem tá na correria: botões grandes, favoritos no topo e botão "Repetir Saideira". Em 5 minutos qualquer garçom já tá voando.' },
    { q: 'Funciona com mais de um garçom lançando ao mesmo tempo?', a: 'Sim! O garçom lança na calçada pelo celular dele, o pedido já apita na tela da cozinha ("Ding! 🛎️") e o caixa no balcão vê a mesa atualizada na mesma hora.' },
    { q: 'Como funciona a Conferência Cega no fechamento?', a: 'Na hora de passar a régua, quem tá no caixa digita quanto contou em dinheiro, Pix e cartão sem ver quanto o sistema esperava. Acaba na hora aquele "acerto criativo" de fim de noite.' },
    { q: 'Meu boteco é raiz, só vende litrão e porção. Vou ver um monte de tela complicada?', a: 'De jeito nenhum! Pelo Princípio Zero Complexidade, módulos avançados (como Coquetelaria em ml ou Hospedaria) ficam 100% escondidos se você não usar. Seu sistema fica limpo e direto ao ponto.' },
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

  const pillarsData = {
    salao: {
      badge: '🍺 Pilar 01 • No Salão & no Balcão',
      title: 'Atendimento em Tempo de Gole',
      subtitle: 'Chega de fila no caixa e garçom perdido fazendo conta de cabeça na sexta lotada.',
      accent: 'emerald' as const,
      features: [
        { icon: '⚡', tag: 'VELOCIDADE', title: 'Venda em 3 Toques + Repetir Saideira', desc: 'As cervejas e porções que mais giram ficam no topo. O cliente pediu "traz mais duas"? Um clique no botão Repetir Saideira e já tá na comanda.' },
        { icon: '🧮', tag: 'SEM CALCULADORA', title: 'Racha a Conta sem Estresse', desc: 'Divide a mesa por cabeça ou por item específico em 2 cliques. Aceita Pix, dinheiro, cartão e pendura na mesma conta, já separando os 10% da equipe.' },
        { icon: '🪑', tag: 'GIRO DE SALÃO', title: 'Radar de Mesa Moscando', desc: 'Bateu o olho no mapa, sabe tudo: mesa verde tá bebendo, amarela deu uma freada, vermelha parou de pedir. O sistema avisa pro garçom chegar junto.' },
        { icon: '🎉', tag: 'DIA DE JOGO', title: 'Modo Evento & Ficha Expressa', desc: 'Lotou a calçada em dia de jogo ou samba? Ligue o Modo Evento com 1 clique: o sistema ignora mesas e vira uma máquina ultrarrápida de venda de balcão.' },
        { icon: '🍻', tag: 'PILOTO AUTOMÁTICO', title: 'Happy Hour que Vira Sozinho', desc: 'Configure o horário promocional uma única vez. Deu 17h, o chopp entra na promoção sozinho; deu 20h, volta pro preço normal sem ninguém esquecer.' },
        { icon: '📱', tag: 'ZERO ATRITO', title: 'Cardápio QR Code Ao Vivo', desc: 'O cliente lê o QR na mesa e vê o cardápio atualizado. Acabou a coxinha na cozinha? Some do celular do cliente no mesmo segundo.' },
      ]
    },
    gaveta: {
      badge: '💰 Pilar 02 • Na Gaveta & no Fiado',
      title: 'Caixa que Bate na Vírgula',
      subtitle: 'Estanque o ralo invisível do bar, aposente o caderninho engordurado e durma em paz.',
      accent: 'red' as const,
      features: [
        { icon: '🕵️', tag: 'FIM DO CHUTE', title: 'Fechamento no Escuro (Conferência Cega)', desc: 'Quem fecha o turno conta as notas da gaveta e digita no sistema sem saber quanto deveria ter. Acabou o "deu certinho, patrão" no olhômetro.' },
        { icon: '💳', tag: 'INTEGRAÇÃO REDE', title: 'Conciliação Automática de Cartões (Itaú)', desc: 'Audite na hora as vendas de cartões, taxas retidas (MDR) e previsão de recebíveis direto do extrato bancário oficial das maquininhas Rede.' },
        { icon: '📓', tag: 'ADEUS CADERNINHO', title: 'Pendura Profissional + Régua no Zap', desc: 'Histórico completo do que o freguês consumiu e disparo de cobrança educada em 1 clique no WhatsApp com sua chave Pix. Receba sem perder o amigo.' },
        { icon: '🛡️', tag: 'OLHO VIVO', title: 'Dedo-Duro Anti-Espertinho (Score)', desc: 'Cancelaram item depois de imprimir a conta? O sistema bloqueia ou exige senha e dá uma nota de confiabilidade pra cada operador do caixa.' },
        { icon: '💵', tag: 'GAVETA LIMPA', title: 'Sangria & Troco Carimbados', desc: 'Tirou R$ 40 do caixa pra pagar o gelo ou o limão? Lança a sangria em 5 segundos igual caixa eletrônico e o fechamento da madrugada não fura.' },
        { icon: '🔑', tag: 'CADA UM NO SEU QUADRADO', title: 'Crachá Digital com 27 Permissões', desc: 'Garçom lança pedido, cozinheiro vê a fila, caixa fecha conta e só o dono vê o lucro líquido. Você trava o que cada um pode mexer.' },
        { icon: '📲', tag: 'NO SEU BOLSO', title: 'Resumo do Turno no Zap do Sócio', desc: 'Passou a régua na noite? Com 1 clique o relatório mastigado (faturamento, ticket médio e diferenças) vai direto pro WhatsApp dos donos.' },
      ]
    },
    cozinha: {
      badge: '🍸 Pilar 03 • Na Cozinha, no Copo & no Estoque',
      title: 'Sem Papel Sujo e Sem Falta de Breja',
      subtitle: 'Da porção saindo quentinha na chapa até o último mililitro da garrafa de Gin.',
      accent: 'amber' as const,
      features: [
        { icon: '🛎️', tag: 'DING! TÁ PRONTO', title: 'Monitor de Cozinha com Campainha', desc: 'O pedido entra na tela touch da cozinha com observações claras ("sem cebola", "bem passado"). Quando fica pronto, apita na hora no celular do garçom.' },
        { icon: '🍸', tag: 'MARGEM DE 80%', title: 'Coquetelaria & Drinks Fracionados', desc: 'Ficha técnica em mililitros (ml). Cada Negroni ou Caipirinha vendida desconta a dose exata da garrafa no estoque e mostra seu CMV ao vivo.' },
        { icon: '🍯', tag: 'PRODUÇÃO DA CASA', title: 'Xaropes & Batches com Validade', desc: 'Produza xaropes, infusões e premixes caseiros em 1 clique: o sistema abate o açúcar e as frutas e controla a validade na geladeira.' },
        { icon: '🚨', tag: 'ESTOQUE ESPERTO', title: 'Alerta de Breja Acabando em Horas', desc: 'Nada de deixar faltar Heineken às 22h de sexta. O sistema mede a velocidade dos pedidos e avisa: "Atenção: estoque dura só mais 3 horas nesse ritmo".' },
        { icon: '🛒', tag: 'COMPRA CERTA', title: 'Lista de Reposição pro Fornecedor', desc: 'Baseado no que realmente girou nos últimos 7 dias, o Botequista monta sua lista de compras da semana pronta pra encaminhar no WhatsApp.' },
        { icon: '📉', tag: 'ZERO FURO', title: 'Registro de Quebra & Consignação', desc: 'Garrafa caiu no chão ou chopp azedou? Registra a perda em 2 toques sabendo o custo em R$. Pegou bebida consignada pra evento? Controle o acerto exato.' },
      ]
    },
    dono: {
      badge: '🧠 Pilar 04 • Na Cabeça do Dono',
      title: 'Sua Consultoria de Boteco no Bolso',
      subtitle: 'Descubra onde mora o lucro real do seu cardápio e crie receita recorrente até em terça chuvosa.',
      accent: 'emerald' as const,
      features: [
        { icon: '💎', tag: 'LUCRO LÍQUIDO', title: 'Engenharia de Cardápio (Vacas vs. Abacaxis)', desc: 'Cruza volume de vendas com custo real (CMV) pra te mostrar quais itens são suas "Vacas Leiteiras" e quais são "Abacaxis" que dão trabalho e pouco lucro.' },
        { icon: '📈', tag: 'PRECIFICADOR', title: 'Radar de Prejuízo & Preço Alvo', desc: 'Subiu o preço do fornecedor e sua margem caiu de 30%? O Radar apita na hora e sugere o novo preço de cardápio pra manter seu lucro saudável.' },
        { icon: '🌤️', tag: 'OLHO NO TEMPO', title: 'Previsão de Movimento por Clima', desc: 'Cruza o histórico do seu bar com a previsão do tempo da sua rua: "Sexta de 31°C em SP = movimento ALTO, gela mais 5 caixas e reforça o gelo".' },
        { icon: '🏆', tag: 'TREINO DE EQUIPE', title: 'Ranking de Garçom Esperto (Upsell)', desc: 'Descubra quem é o garçom que só tira pedido e quem é o craque que oferece porção, adicional e bebida melhor, puxando seu ticket médio pra cima.' },
        { icon: '👑', tag: 'CAIXA GARANTIDO', title: 'Clube do Chopp & Assinaturas', desc: 'Crie planos mensais pros clientes fiéis (ex: 1 chopp por dia). O freguês vem buscar o chopp do clube na terça-feira e já pede uma porção pra acompanhar.' },
        { icon: '⚙️', tag: 'SOB MEDIDA', title: 'Multi-Unidades & Zero Complexidade', desc: 'Tem mais de um bar ou pousada/quartos junto? Gerencie tudo num lugar só, ligando ou desligando módulos extras (Drinks, Hospedaria) por unidade.' },
      ]
    }
  };

  const currentPillar = pillarsData[activePillar];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* ─── CSS ─── */}
      <style>{`
        .scroll-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: all 0.75s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scroll-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-gradient {
          background: radial-gradient(ellipse 80% 55% at 50% -5%, rgba(220, 38, 38, 0.18), transparent),
                      radial-gradient(ellipse 55% 45% at 15% 40%, rgba(245, 158, 11, 0.08), transparent),
                      radial-gradient(ellipse 60% 40% at 85% 95%, rgba(16, 185, 129, 0.10), transparent);
        }
        .cta-glow {
          box-shadow: 0 0 50px rgba(37, 211, 102, 0.25), 0 0 100px rgba(37, 211, 102, 0.08);
        }
        .cta-glow:hover {
          box-shadow: 0 0 70px rgba(37, 211, 102, 0.4), 0 0 140px rgba(37, 211, 102, 0.15);
        }
        .float-anim {
          animation: gentleFloat 6s ease-in-out infinite;
        }
        .float-anim-delayed {
          animation: gentleFloat 6s ease-in-out 2s infinite;
        }
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
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
        .glow-pulse {
          animation: glowPulse 2s ease-in-out infinite;
        }
        .glow-pulse-amber {
          animation: glowPulseAmber 2s ease-in-out infinite;
        }
        .glow-pulse-red {
          animation: glowPulseRed 2s ease-in-out infinite;
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.15), inset 0 0 5px rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); }
          50% { box-shadow: 0 0 25px rgba(16, 185, 129, 0.4), inset 0 0 10px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.5); }
        }
        @keyframes glowPulseAmber {
          0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.15), inset 0 0 5px rgba(245, 158, 11, 0.05); border-color: rgba(245, 158, 11, 0.2); }
          50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.4), inset 0 0 10px rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.5); }
        }
        @keyframes glowPulseRed {
          0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.15), inset 0 0 5px rgba(239, 68, 68, 0.05); border-color: rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.5); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #020617;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 9999px;
          border: 2px solid #020617;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #1e293b #020617;
        }
      `}</style>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 bg-[#020617]/85 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-barrio text-2xl shadow-lg shadow-red-600/30 border border-red-400/30">B</div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase font-barrio leading-none">Botequista</span>
              <span className="text-[8px] font-black tracking-[0.25em] uppercase text-amber-400 italic mt-0.5">Gestão de Balcão • Sem Frescura</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-7">
            <button onClick={() => scrollToSection('perrengue')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors cursor-pointer">O Sufoco</button>
            <button onClick={() => scrollToSection('pilares')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors cursor-pointer">O Que Faz</button>
            <button onClick={() => scrollToSection('sistema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors cursor-pointer">Telas Reais</button>
            <button onClick={() => scrollToSection('coquetelaria')} className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/25 cursor-pointer">
              <span>🍸</span> Drinks 2.0
            </button>
            <button onClick={() => scrollToSection('preco')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors cursor-pointer">Parceria R$ 0</button>
            <button onClick={() => setIsTechConsoleModalOpen(true)} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">🤓 Papo de Nerd</button>
            <a href="/?demo=true" className="text-[10px] font-black uppercase tracking-[0.15em] text-white bg-slate-900 hover:bg-slate-800 border border-white/15 px-4 py-2.5 rounded-xl transition-all">
              🍺 Abrir Demo
            </a>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-900/40">
              Chamar no Zap
            </a>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white p-2" aria-label="Menu">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
          </button>
        </div>
        {/* Mobile Menu */}
        <div className={`fixed inset-0 z-50 lg:hidden bg-[#020617]/98 backdrop-blur-2xl transition-all duration-500 ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center justify-center h-full gap-7 p-6">
            <button onClick={() => scrollToSection('perrengue')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">O Sufoco vs. A Paz</button>
            <button onClick={() => scrollToSection('pilares')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Os 4 Pilares do Bar</button>
            <button onClick={() => scrollToSection('sistema')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Telas Reais</button>
            <button onClick={() => scrollToSection('coquetelaria')} className="text-xl font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-2">
              <span>🍸</span> Coquetelaria & Drinks
            </button>
            <button onClick={() => scrollToSection('preco')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Parceria Grátis</button>
            <button onClick={() => { setIsTechConsoleModalOpen(true); setIsMenuOpen(false); }} className="text-lg font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400">🤓 Papo de Nerd (Tech)</button>
            <div className="flex flex-col w-full max-w-xs gap-3 pt-4">
              <a href="/?demo=true" onClick={() => setIsMenuOpen(false)} className="w-full bg-slate-900 border border-white/15 text-white px-8 py-4 rounded-2xl text-center text-base font-black uppercase tracking-tight">
                🍺 Testar Demo no Celular
              </a>
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full bg-[#16a34a] text-white px-8 py-4 rounded-2xl text-center text-base font-black uppercase tracking-tight shadow-xl">
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>
      {/* ─── HERO ─── */}
      <section className="hero-gradient relative pt-14 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-[0.25em] mb-8 scroll-reveal">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            🍻 Parceria de Balcão • 100% na faixa pros primeiros bares
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[0.88] mb-8 uppercase scroll-reveal">
            <span className="block text-white">Fácil igual seu</span>
            <span className="text-amber-400 block italic">caderninho.</span>
            <span className="block text-emerald-400">Esperto igual dono de bar.</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-200 mb-10 leading-relaxed font-medium max-w-3xl mx-auto scroll-reveal">
            Aposente a comanda engordurada e a calculadora no balcão. O Botequista <span className="text-white font-bold">fecha seu caixa na vírgula</span>, avisa qual mesa tá moscando, controla a <span className="text-amber-400 font-bold">pendura sem climão</span> e <span className="text-emerald-400 font-bold">não trava nem se o Wi-Fi cair</span> no pico de sexta-feira.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 scroll-reveal">
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow flex items-center justify-center gap-3 bg-[#16a34a] hover:bg-[#15803d] text-white px-9 py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95 shadow-2xl w-full sm:w-auto">
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chamar no Zap e Liberar Meu Bar
            </a>
            <a href="/?demo=true" className="flex items-center justify-center gap-2 px-9 py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-tight transition-all bg-slate-900/90 border border-white/15 hover:border-amber-400/50 hover:bg-slate-800 text-white shadow-xl w-full sm:w-auto">
              <span>🍺</span> Mexer no Sistema Agora (Demo)
            </a>
          </div>

          {/* Quick Boteco Proof Badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-14 scroll-reveal">
            {[
              { icon: '⚡', text: 'Pedido lançado em 2s' },
              { icon: '📶', text: 'Funciona 100% sem Wi-Fi' },
              { icon: '🕵️', text: 'Conferência Cega de Gaveta' },
              { icon: '💳', text: 'Conciliação REDE (Itaú)' },
              { icon: '🚀', text: 'Sem mensalidade fixa' },
            ].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 border border-white/10 text-slate-200 text-xs font-bold">
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>

          {/* Hero Image + Floating Live Bar Notifications */}
          <div className="relative max-w-5xl mx-auto scroll-reveal">
            {/* Floating Live Badge 1 (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 absolute -left-8 top-14 z-30 bg-slate-900/95 border border-amber-500/40 px-4 py-3 rounded-2xl shadow-2xl float-anim">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">🍺</div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase text-amber-400">Botão Repetir Saideira</div>
                <div className="text-xs font-bold text-white">+2 Original 600ml na Mesa 07 (1.2s)</div>
              </div>
            </div>

            {/* Floating Live Badge 2 (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 absolute -right-8 top-24 z-30 bg-slate-900/95 border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl float-anim-delayed">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">🛎️</div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase text-emerald-400">Cozinha Apitou (Ding!)</div>
                <div className="text-xs font-bold text-white">Porção de Panceta pronta • Mesa 12</div>
              </div>
            </div>

            {/* Floating Live Badge 3 (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 absolute -bottom-6 right-12 z-30 bg-slate-900/95 border border-red-500/40 px-4 py-3 rounded-2xl shadow-2xl float-anim">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-lg">⏰</div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase text-red-400">Radar de Salão</div>
                <div className="text-xs font-bold text-white">Mesa 03 moscando há 42 min • Oferecer rodada</div>
              </div>
            </div>

            <BrowserFrame
              src="/landing_assets/assets/dashboard_real.png"
              alt="Painel de Vendas Real do Botequista"
              label="Tela Real de Produção • Zero Photoshop"
              callout="Roda liso no celular, tablet ou PC do caixa"
            />
          </div>
        </div>
      </section>

      {/* ─── SEXTA-FEIRA 21H: O SUFOCO VS A PAZ (THE PROBLEM / CONTRAST) ─── */}
      <section id="perrengue" className="py-28 px-6 bg-slate-950/60 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-red-500 mb-3 block">Papo Reto de Balcão</span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-[0.92] uppercase">
              Sexta-feira, 21h, casa cheia. <br/>
              <span className="text-red-500 italic">Você conhece esse sufoco.</span>
            </h2>
            <p className="mt-5 text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
              Quem toca bar em São Paulo sabe onde o sapato aperta quando o movimento engrossa. Veja o que muda no primeiro fim de semana com o Botequista:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna 1: O Sufoco */}
            <div className="scroll-reveal p-8 sm:p-10 rounded-[36px] bg-red-950/15 border border-red-500/20 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-red-500/20">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 flex items-center justify-center text-xl">🥵</div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">No Papel ou Sistema Travado</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Onde o lucro vai embora pelo ralo</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Wi-Fi caiu na chuva de sexta = Bar travado', desc: 'A internet oscila, o sistema tradicional congela e forma fila de cliente bravo querendo pagar no balcão.' },
                  { title: '2h da manhã e faltam R$ 150 na gaveta', desc: 'Todo mundo exausto, ninguém sabe se foi troco errado, sangria pro gelo sem anotar ou "acerto no olhômetro".' },
                  { title: '"Marca no caderninho aí que quinta eu acerto"', desc: 'A folha molha de cerveja, a letra fica ilegível ou bate aquela vergonha de cobrar o freguês antigo.' },
                  { title: 'Garçom gritando pedido e mesa esquecida', desc: 'Porção que sai errada na cozinha e mesa ocupando 4 cadeiras há uma hora sem ninguém encostar pra vender mais uma.' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-red-500/10 flex gap-3.5 items-start">
                    <span className="text-red-500 font-black text-base mt-0.5">✕</span>
                    <div>
                      <div className="text-sm font-black text-white mb-1">{item.title}</div>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna 2: No Botequista */}
            <div className="scroll-reveal p-8 sm:p-10 rounded-[36px] bg-emerald-950/15 border border-emerald-500/30 space-y-6 shadow-2xl shadow-emerald-950/20">
              <div className="flex items-center gap-3 pb-4 border-b border-emerald-500/20">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl">🍻</div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">No Botequista (Régua Passada)</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Operação azeitada e bolso protegido</span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'Caiu a internet? O garçom nem fica sabendo', desc: 'Grava tudo no aparelho em 2 milissegundos. A noite corre solta e, quando o sinal volta, sobe tudo pra nuvem sozinho.' },
                  { title: 'Fechamento no Escuro (Conferência Cega)', desc: 'O caixa digita o que contou na gaveta sem ver o valor esperado. Bateu, bateu; se deu diferença, você descobre na hora.' },
                  { title: 'Pendura Digital + Lembrete Amigável no Zap', desc: 'Ficha limpa de cada cliente e mensagem pronta com sua chave Pix pra cobrar no WhatsApp sem perder a amizade.' },
                  { title: 'Campainha na Cozinha + Alerta de Mesa Moscando', desc: 'O cozinheiro aperta um botão e o celular do garçom apita ("Ding!"). E se a mesa parar de beber, fica vermelha no mapa.' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex gap-3.5 items-start">
                    <span className="text-emerald-400 font-black text-base mt-0.5">✓</span>
                    <div>
                      <div className="text-sm font-black text-white mb-1">{item.title}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OS 4 PILARES DO BOTEQUISTA (CLAREZA TOTAL DE FUNCIONALIDADES) ─── */}
      <section id="pilares" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400 mb-3 block">Tudo o que seu bar precisa, sem ponta solta</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Os 4 Pilares da <span className="text-emerald-400 italic">Noite Perfeita</span>.
            </h2>
            <p className="mt-5 text-slate-300 text-lg max-w-2xl mx-auto">
              Navegue pelas 4 áreas do seu boteco abaixo e veja exatamente como cada ferramenta resolve a vida real do balcão:
            </p>
          </div>

          {/* Interactive Pillar Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12 scroll-reveal">
            {[
              { id: 'salao', icon: '🍺', title: '1. Salão & Balcão', sub: 'Velocidade no Pico' },
              { id: 'gaveta', icon: '💰', title: '2. Gaveta & Fiado', sub: 'Caixa Blindado' },
              { id: 'cozinha', icon: '🍸', title: '3. Cozinha & Copo', sub: 'Estoque & Drinks' },
              { id: 'dono', icon: '🧠', title: '4. Cabeça do Dono', sub: 'Lucro & Consultoria' },
            ].map((tab) => {
              const isSelected = activePillar === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePillar(tab.id as any)}
                  className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer flex items-center gap-3.5 ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-500/20 to-slate-900 border-emerald-400/60 shadow-xl shadow-emerald-950/40 scale-[1.02]'
                      : 'bg-slate-900/60 border-white/10 hover:border-white/25 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-white'}`}>
                    {tab.icon}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black uppercase text-white leading-tight">{tab.title}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>{tab.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Header */}
          <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 block mb-1">{currentPillar.badge}</span>
              <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">{currentPillar.title}</h3>
              <p className="text-slate-300 text-sm mt-1">{currentPillar.subtitle}</p>
            </div>
            <a
              href="/?demo=true"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-slate-950 text-xs font-black uppercase tracking-widest transition-all text-center flex-shrink-0"
            >
              Testar isso no Demo →
            </a>
          </div>

          {/* Active Pillar 6 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPillar.features.map((f, idx) => (
              <FeatureCard
                key={`${activePillar}-${idx}`}
                icon={f.icon}
                tag={f.tag}
                title={f.title}
                desc={f.desc}
                accent={currentPillar.accent}
              />
            ))}
          </div>

          {/* Highlight: Offline Resilience */}
          <div className="mt-20 p-8 sm:p-14 rounded-[40px] bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-950 border border-emerald-500/30 scroll-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">
                  📶 Blindagem Contra Operadora Ruim
                </div>
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.92]">
                  Choveu em São Paulo e o Wi-Fi caiu? <span className="text-emerald-400 italic">Seu balcão nem pisca.</span>
                </h3>
                <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                  Sistemas comuns travam na tela de carregamento quando a internet oscila. O Botequista grava cada cerveja, porção e fechamento direto no aparelho em milissegundos e sincroniza sozinho em segundo plano quando o sinal volta.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {['Zero Comanda Perdida', 'Sincroniza Sozinho', 'Sem Servidor Caro no Bar', 'Backup na Nuvem + GitHub'].map(tag => (
                    <span key={tag} className="px-4 py-2 rounded-full bg-slate-950/80 border border-emerald-500/25 text-emerald-300 text-[10px] font-black uppercase tracking-wider">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 text-center">
                <div className="inline-flex flex-col items-center gap-3 p-8 rounded-3xl bg-slate-950/80 border border-emerald-500/20 w-full">
                  <div className="text-5xl float-anim">⚡</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Tempo de Resposta no Balcão</div>
                  <div className="text-5xl sm:text-6xl font-black text-white">0,002s</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mesmo com o cabo de rede puxado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REAL SCREENSHOTS & INTERACTIVE PREVIEWS ─── */}
      <section id="sistema" className="py-28 px-6 bg-slate-950/40 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400 mb-3 block">Sem maquiagem • Do jeito que roda no balcão</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
              Veja a Cara do <span className="text-red-500 italic">Sistema Real.</span>
            </h2>
            <p className="mt-5 text-slate-300 text-lg max-w-2xl mx-auto">
              Clique nas abas abaixo para passear pelas 10 telas do Botequista — do lançamento da breja até a campainha da cozinha e o fechamento cego:
            </p>
          </div>

          <ScreenshotGallery />
        </div>
      </section>

      {/* ─── WHATSAPP REPORTS & PENDURA COLLECTION ─── */}
      <section className="py-28 px-6 bg-[#020617] relative border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <WhatsAppSimulation />
            </div>
            <div className="order-1 lg:order-2 space-y-7 scroll-reveal">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400 block">📲 O Bar Inteiro no Seu Zap</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
                Feche o Turno e Cobre o Fiado <span className="text-emerald-400 italic">em 1 Clique</span>.
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Ninguém merece ficar preenchendo planilha de madrugada ou passar vergonha cobrando amigo. O Botequista já monta o texto formatado e abre seu WhatsApp pronto pra disparar:
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Resumo de Fechamento pro Sócio', desc: 'Total vendido, Pix, Cartão, Dinheiro na gaveta, ticket médio e produto campeão da noite.' },
                  { title: 'Régua de Cobrança Educada (Pendura)', desc: 'Manda o extrato certinho pro freguês com sua chave Pix num tom parceiro e sem climão.' },
                  { title: 'Lista de Compras da Semana', desc: 'Envia direto pro distribuidor quantas caixas de cerveja e insumos precisam ser repostos.' },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">✓</div>
                    <div>
                      <div className="text-sm font-black uppercase text-white">{item.title}</div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COQUETELARIA & DRINKS 2.0 SHOWCASE ─── */}
      <CocktailLabShowcase />

      {/* ─── QR CODE MENU SECTION (WITH LIVE CLICKABLE LINK TO /menu) ─── */}
      <section className="py-28 px-6 relative overflow-hidden bg-slate-950/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 scroll-reveal">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400 block">📱 Cardápio de Mesa Inteligente</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase">
                Acabou na Cozinha? <span className="text-emerald-400 italic">Some do Cardápio na Hora.</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Sabe aquele constrangimento do cliente escolher uma porção, chamar o garçom e ouvir <em>"Ih chefia, essa acabou faz meia hora"</em>? No Botequista, quando a última unidade sai no PDV, o cardápio QR Code da mesa se atualiza sozinho no mesmo segundo.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-6 bg-slate-900/60 border border-white/10 rounded-3xl">
                  <h4 className="font-black uppercase text-xs text-emerald-400 mb-2">🍺 Fim do "Ih, Acabou!"</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">Sincronizado ao vivo com o estoque do balcão. O cliente só vê na tela o que realmente tem gelado pra sair.</p>
                </div>
                <div className="p-6 bg-slate-900/60 border border-white/10 rounded-3xl">
                  <h4 className="font-black uppercase text-xs text-amber-400 mb-2">⚡ Mudou o Preço, Tá Valendo</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">Sem gastar com gráfica ou adesivo em cima de cardápio plastificado. Alterou no caixa, mudou em todas as mesas.</p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="/menu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20"
                >
                  <span>📱</span>
                  <span>Abrir Cardápio Digital Ao Vivo (/menu) →</span>
                </a>
              </div>
            </div>

            <div className="relative group scroll-reveal">
              <div className="absolute -inset-10 bg-emerald-500/10 blur-[100px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <a
                href="/menu"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative bg-slate-900 p-4 rounded-[56px] border border-white/15 hover:border-emerald-500/50 shadow-2xl max-w-[290px] mx-auto transform -rotate-2 group-hover:rotate-0 transition-all duration-500 cursor-pointer"
                aria-label="Abrir Cardápio Digital Ao Vivo"
              >
                <div className="bg-slate-950 rounded-[46px] aspect-[9/19] overflow-hidden border border-white/10 relative">
                  <img src="/landing_assets/assets/Screenshot_2026-03-03_21-32-14.png" alt="Cardápio Digital Botequista" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                  <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                    <div className="text-xs font-black text-white uppercase tracking-widest mb-1">Cardápio da Mesa</div>
                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Clique para abrir ao vivo ↗</div>
                  </div>
                </div>
                <div className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500 hover:bg-emerald-400 rounded-full flex flex-col items-center justify-center text-slate-950 text-center shadow-2xl shadow-emerald-500/30 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500">
                  <div className="text-2xl mb-0.5">📱</div>
                  <div className="text-[8px] font-black uppercase leading-tight">Clique e<br/>Teste Agora</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA (3 PASSOS RÁPIDOS) ─── */}
      <section className="py-28 px-6 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400 mb-3 block">Sem técnico de informática • Sem chá de cadeira</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Do Zero ao Primeiro Chopp em <span className="text-emerald-400 italic">15 Minutos</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Dá um Alô no Zap', desc: 'Chama a gente no WhatsApp. Liberamos seu acesso de Parceiro Fundador na hora, sem pedir cartão nem burocracia.', icon: '💬' },
              { step: '02', title: 'Sobe o Cardápio da Casa', desc: 'Cadastra suas brejas, doses e porções (ou manda foto do cardápio que ajudamos a subir). Tudo separado por categoria.', icon: '📋' },
              { step: '03', title: 'Abre o Turno e Passa a Régua', desc: 'Pronto! Garçom lançando pelo celular, cozinha apitando pedido pronto e gaveta batendo na vírgula já na primeira noite.', icon: '🍻' },
            ].map((s, i) => (
              <div key={i} className="scroll-reveal p-8 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-3xl">
                      {s.icon}
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      Passo {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3 text-white">{s.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENTO GRID: TUDO NO ESQUEMA (REPLACING THE 53-LINE RAW CHANGELOG) ─── */}
      <section className="py-28 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-3 block">Pacote Completo • Zero Mensalidade Escondida</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Tudo Isso Vem <span className="text-red-500 italic">no Esquema</span>
            </h2>
            <p className="mt-4 text-slate-300 text-base max-w-2xl mx-auto">
              Não cobramos "módulo extra" pra liberar função importante. Entrou como bar parceiro, leva a caixa de ferramentas inteira:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-reveal">
            {[
              {
                category: '🍺 Balcão, Mesas & Atendimento',
                color: 'border-emerald-500/25 bg-emerald-950/10',
                badgeColor: 'text-emerald-400',
                items: [
                  'PDV Rápido com Favoritos no Topo e Atalho F4',
                  'Botão "Repetir Saideira" (repete rodada em 1 toque)',
                  'Mapa Visual de Mesas com Contador de Tempo',
                  'Radar de Mesa Moscando (alerta de ociosidade)',
                  'Racha-Conta por Pessoa ou por Item Consumido',
                  'Modo Evento / Dia de Jogo (venda expressa sem mesa)',
                  'Happy Hour Automático com Virada de Preço na Hora',
                  'Cardápio Digital QR Code Sincronizado com Estoque',
                ]
              },
              {
                category: '💰 Caixa, Fiado & Blindagem Anti-Furto',
                color: 'border-red-500/25 bg-red-950/10',
                badgeColor: 'text-red-400',
                items: [
                  'Conferência Cega de Caixa (fechamento no escuro)',
                  'Sangria, Suprimento e Controle de Troco/Cofre',
                  'Taxa de Serviço Opcional (10%) Separada por Garçom',
                  'Módulo Pendura (Fiado) com Histórico Completo',
                  'Régua de Cobrança Educada em 1 Clique no WhatsApp',
                  'Score de Risco Anti-Fraude por Operador de Caixa',
                  'Trava de Segurança pós-impressão de Comanda',
                  'Crachá Digital com 27 Permissões Sob Medida',
                ]
              },
              {
                category: '🍸 Cozinha, Coquetelaria & Estoque',
                color: 'border-amber-500/25 bg-amber-950/10',
                badgeColor: 'text-amber-400',
                items: [
                  'Monitor de Cozinha Touch com Campainha Sonora ("Ding! 🛎️")',
                  'Fichas Técnicas de Drinks Fracionadas em Mililitros (ml)',
                  'Produção de Xaropes & Batches Caseiros com Validade',
                  'Alerta de Ruptura: Avisa em Quantas Horas a Breja Acaba',
                  'Lista de Compras da Semana Gerada pro WhatsApp',
                  'Auditoria de Garrafas Quebradas, Sobras e Vencimentos',
                  'Controle de Bebidas Consignadas para Festas e Eventos',
                  'Validador Inteligente (evita cadastros bagunçados no PDV)',
                ]
              },
              {
                category: '🧠 Inteligência do Dono & Expansão',
                color: 'border-blue-500/25 bg-blue-950/10',
                badgeColor: 'text-blue-400',
                items: [
                  'Assistente do Dono: Faturamento, CMV e Lucro Líquido Real',
                  'Matriz BCG de Cardápio (Estrelas, Vacas Leiteiras e Abacaxis)',
                  'Radar de Prejuízo (alerta itens com margem abaixo de 30%)',
                  'Previsão de Movimento do Dia cruzando Histórico + Clima',
                  'Clube do Chopp / Assinaturas Recorrentes por CPF/Celular',
                  'Ranking de Garçom Esperto por Ticket Médio e Upsell',
                  'Painel Multi-Unidades / Franquias + Módulo de Hospedaria',
                  'Operação 100% Offline-First com Backup Nuvem e GitHub',
                ]
              }
            ].map((group, idx) => (
              <div key={idx} className={`p-8 rounded-[32px] border ${group.color} space-y-5`}>
                <h3 className={`text-base font-black uppercase tracking-wider ${group.badgeColor}`}>
                  {group.category}
                </h3>
                <ul className="space-y-3">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-200 font-medium">
                      <svg className={`w-5 h-5 ${group.badgeColor} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section className="py-28 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-red-500 mb-3 block">Compare sem medo</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
              Botequista vs. <span className="text-red-500 italic">Sistemas Caretas</span>
            </h2>
          </div>
          <div className="scroll-reveal bg-slate-950/90 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-3 py-5 bg-white/5 px-6 font-black uppercase text-[11px] tracking-wider border-b border-white/10">
              <div className="text-slate-200">No Dia a Dia do Balcão</div>
              <div className="text-center text-emerald-400">🍻 Botequista</div>
              <div className="text-center text-slate-400">Sistemas Comuns</div>
            </div>
            {[
              { f: 'Continua vendendo se o Wi-Fi cair na sexta à noite', b: true, t: false },
              { f: 'Conferência Cega (caixa conta sem ver o esperado)', b: true, t: false },
              { f: 'Conciliação automática com maquininhas REDE (Itaú)', b: true, t: false },
              { f: 'Radar de Mesa Moscando + Botão Repetir Saideira', b: true, t: false },
              { f: 'Ficha de Drinks em ml + Batches Caseiros com Validade', b: true, t: false },
              { f: 'Régua de Cobrança de Fiado (Pendura) no WhatsApp', b: true, t: false },
              { f: 'Monitor de Cozinha Touch com Campainha ("Ding! 🛎️")', b: true, t: false },
              { f: 'Alerta de Cerveja Acabando em Horas (Smart Stock)', b: true, t: false },
              { f: 'Lucro Líquido Real (CMV) + Matriz Vaca Leiteira / Abacaxi', b: true, t: false },
              { f: 'Previsão de Movimento por Clima da Semana', b: true, t: false },
              { f: 'Clube de Assinaturas / Recorrência pro Freguês', b: true, t: false },
              { f: 'Modo Evento (Venda Expressa) + Happy Hour Automático', b: true, t: false },
              { f: 'Roda em qualquer Celular, Tablet ou PC sem instalar nada', b: true, t: false },
              { f: 'Resumo de Fechamento de Turno no WhatsApp', b: true, t: true },
              { f: '100% Grátis pros Bares Parceiros Fundadores', b: true, t: false },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-3 py-4 border-b border-white/5 items-center px-6 hover:bg-white/[0.02] transition-colors text-sm">
                <div className="text-slate-200 font-semibold text-xs sm:text-sm pr-2">{row.f}</div>
                <div className="text-center">{row.b ? <span className="inline-flex items-center gap-1 text-emerald-400 font-black text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">✓ TEM</span> : <span className="text-red-500">✗</span>}</div>
                <div className="text-center opacity-50">{row.t ? <span className="text-emerald-500 font-black text-xs">✓ Alguns</span> : <span className="text-red-400 font-bold text-xs">✗ Não tem</span>}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE TECH MODAL ─── */}
      {isTechConsoleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={() => setIsTechConsoleModalOpen(false)} />
          
          <div className="relative bg-[#070b19]/90 border border-white/5 rounded-[40px] w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(16,185,129,0.15)] flex flex-col custom-scrollbar">
            {/* Modal Header */}
            <div className="bg-[#0b1328] p-5 border-b border-white/5 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div onClick={() => setIsTechConsoleModalOpen(false)} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400 transition-colors"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase">
                  engine@botequista:~/interactive_tech_console
                </span>
              </div>
              <button 
                onClick={() => setIsTechConsoleModalOpen(false)} 
                className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest"
              >
                Fechar
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 bg-slate-950">
              <TechSection onOpenDiagnostics={() => {
                setIsTechConsoleModalOpen(false);
                setIsNerdModalOpen(true);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-28 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400 mb-3 block">Quem tá atrás do balcão aprova</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
              Papo de <span className="text-red-500 italic">Dono pra Dono</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              { name: 'Ricardo', bar: 'Bar do Galego', quote: 'Antes toda segunda-feira era dor de cabeça com R$ 200 sumindo no caixa da semana. Depois que ligamos a Conferência Cega, a gaveta bate cravado todo santo dia.', role: 'Dono do Bar', stars: 5, color: 'from-amber-500/10', img: '/landing_assets/testimonials/ricardo.png' },
              { name: 'Mariana', bar: 'Sunset Lounge', quote: 'A Matriz de Cardápio me abriu o olho: uma cerveja que eu jurava que dava dinheiro era na verdade um "Abacaxi" com margem pífia. Ajustei o preço e o lucro líquido subiu 18%.', role: 'Sócia-Gerente', stars: 5, color: 'from-indigo-500/10', img: '/landing_assets/testimonials/mariana.png' },
              { name: 'Ozzy', bar: 'Botequim Gourmet', quote: 'Toco 3 casas e acompanho o fechamento pelo Zap deitado no sofá. Mesmo quando o garçom vai atender na calçada onde o Wi-Fi não pega, não perde um pedido.', role: 'Franqueador', stars: 5, color: 'from-emerald-500/10', img: '/landing_assets/testimonials/ozzy.png' },
              { name: 'Cláudio', bar: 'Espeto Real', quote: 'Véspera de feriado às 19h e o alerta de estoque avisou que o carvão e a Original iam zerar antes das 22h. Corri atrás a tempo e salvei a melhor noite do mês.', role: 'Proprietário', stars: 5, color: 'from-red-500/10', img: '/landing_assets/testimonials/claudio.png' },
              { name: 'Ana', bar: 'Vila Madalena House', quote: 'Acabou a briga na divisão dos 10% e a gritaria na janela da cozinha. O cozinheiro toca a campainha na tela e já apita no celular do garçom.', role: 'Gerente de Salão', stars: 5, color: 'from-blue-500/10', img: '/landing_assets/testimonials/ana.png' },
            ].map((t, i) => (
              <div key={i} className={`scroll-reveal p-9 rounded-[36px] bg-gradient-to-br ${t.color} to-slate-900/40 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1.5 group relative overflow-hidden flex flex-col justify-between`}>
                <div>
                  <div className="absolute top-0 right-0 p-8 text-6xl opacity-[0.04] group-hover:opacity-[0.08] transition-all">"</div>
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                  </div>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-8 font-medium italic relative z-10">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/15 group-hover:border-amber-400/40 transition-all">
                    <img src={t.img} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div>
                    <div className="text-white font-black text-sm uppercase tracking-tight">{t.name}</div>
                    <div className="text-[10px] text-amber-400/90 font-bold uppercase tracking-widest">{t.role} • {t.bar}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ─── */}
      <section className="py-24 px-6 bg-slate-950/60 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <ROICalculator />
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="preco" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400 mb-3 block">Parceria Honesta • Sem Pegadinha</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-5">
              É <span className="text-emerald-400 italic">Na Faixa</span> De Verdade
            </h2>
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-14">
              Estamos selecionando bares parceiros para crescer junto com a gente. Enquanto os outros cobram R$ 200+ por mês mais taxa de implantação, você entra como Parceiro Fundador pagando zero.
            </p>
          </div>

          <div className="scroll-reveal p-8 sm:p-14 rounded-[40px] bg-slate-900/60 border border-emerald-500/30 relative overflow-hidden shine shadow-2xl shadow-emerald-950/30">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-8 py-2 rounded-b-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/30">
              🍻 Vaga de Parceiro Fundador
            </div>

            <div className="pt-8 mb-10">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-slate-400 text-2xl font-bold line-through">R$ 197</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">/mês nos concorrentes</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl md:text-8xl font-black text-white">R$ 0</span>
                <span className="text-xl font-bold text-slate-300">/mês</span>
              </div>
              <p className="text-emerald-400 font-bold text-sm mt-3">100% liberado para os primeiros bares parceiros.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left mb-10 bg-slate-950/60 p-6 rounded-3xl border border-white/5">
              {[
                'PDV Rápido + Botão Repetir Saideira',
                'Conferência Cega + Dedo-Duro Anti-Fraude',
                'Monitor de Cozinha Touch ("Ding! 🛎️")',
                'Coquetelaria em ml + Batches Caseiros',
                'Módulo Pendura + Cobrança no Zap',
                'Assistente do Dono + Lucro Real (CMV)',
                'Funciona 100% Sem Internet (Offline)',
                'Suporte Direto com a Gente no WhatsApp',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-xs sm:text-sm text-slate-200 font-semibold">{f}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center justify-center gap-3 bg-[#16a34a] hover:bg-[#15803d] text-white px-10 py-5 rounded-2xl text-base sm:text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Garantir Minha Vaga no Zap
              </a>
              <a href="/?demo=true" className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-white/15 text-white px-8 py-5 rounded-2xl text-base font-black uppercase tracking-tight transition-all">
                🍺 Testar Antes
              </a>
            </div>

            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Sem cartão de crédito • Sem contrato de fidelidade • Sai quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-28 px-6 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14 scroll-reveal">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-400 mb-3 block">Sem letra miúda</span>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">Tira-Dúvidas de Balcão</h2>
            
            {/* FAQ Search */}
            <div className="relative max-w-md mx-auto">
               <input 
                  type="text" 
                  placeholder="Busque uma dúvida (ex: internet, grátis, garçom...)" 
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-2xl px-6 py-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-emerald-500/60 transition-all text-center text-white placeholder:text-slate-500"
               />
               <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
            </div>
          </div>

          <div className="space-y-2">
            {filteredFAQs.length === 0 ? (
               <div className="py-10 text-center opacity-50">
                  <p className="text-xs font-black uppercase tracking-widest italic">Nenhuma resposta encontrada — chama a gente no Zap que respondemos na hora!</p>
               </div>
            ) : (
               filteredFAQs.map((faq, i) => (
                  <div key={i} className="scroll-reveal group border-b border-white/10 cursor-pointer" onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}>
                    <div className="flex justify-between items-center py-6 group-hover:text-emerald-400 transition-colors">
                      <span className="text-base font-bold pr-4">{faq.q}</span>
                      <span className={`text-xl font-black flex-shrink-0 transition-transform duration-300 ${activeFAQ === i ? 'rotate-45 text-emerald-400' : ''}`}>+</span>
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ${activeFAQ === i ? 'max-h-48 pb-6' : 'max-h-0'}`}>
                      <p className="text-slate-300 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
               ))
            )}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="scroll-reveal p-10 sm:p-14 rounded-[40px] bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl">
            <span className="text-4xl block mb-4">🍻</span>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.95] mb-4">
              Bora <span className="text-emerald-400 italic">passar a régua</span> na bagunça?
            </h3>
            <p className="text-slate-300 mb-8 text-base max-w-xl mx-auto">
              Em 2 minutos você testa o sistema completo direto na tela ou chama a gente no WhatsApp pra deixarmos seu bar no jeito ainda hoje.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="cta-glow inline-flex items-center justify-center gap-3 bg-[#16a34a] hover:bg-[#15803d] text-white px-10 py-4 rounded-2xl text-base sm:text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95">
                Chamar no WhatsApp
              </a>
              <a href="/?demo=true" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-white/15 text-white px-10 py-4 rounded-2xl text-base sm:text-lg font-black uppercase tracking-tight transition-all hover:scale-105 active:scale-95">
                🍺 Abrir Bar de Teste (Demo)
              </a>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="py-16 border-t border-white/10 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-barrio text-lg">B</div>
            <span className="text-lg font-black uppercase font-barrio text-slate-200">Botequista</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">v5.7 • Feito pra Boteco</span>
          </div>
          <p className="text-xs font-bold text-slate-400">&copy; {new Date().getFullYear()} Botequista. De balcão pra balcão.</p>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="/menu" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Cardápio QR</a>
            <button onClick={() => setIsTechConsoleModalOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">Console Tech</button>
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
                  <span>~/architecture_v5.5.0</span>
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
                { id: 'sec', label: '04. SECURITY_HARDENING', icon: '🛡️' },
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
            <div className="flex-1 overflow-y-auto p-8 relative z-20 custom-scrollbar">
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

              {nerdTab === 'sec' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'CLUBE DE ASSINATURAS (v5.5.0)', desc: 'Clube de fidelização recorrente integrado offline-first por CPF/Telefone no PDV com cota diária inteligente.', icon: '👤' },
                      { title: 'SCORE DE RISCO ANTIFRAUDE (v5.5.0)', desc: 'Cálculo de índice de integridade por atendente baseado em remoções suspeitas pós-impressão e quebra de caixa.', icon: '🛡️' },
                      { title: 'RBAC HÍBRIDO (v5.2.0)', desc: 'Matriz granular de 27 permissões de nível militar com fallbacks automáticos para contas legadas (anti-lockout).', icon: '🔑' },
                      { title: 'DESATIVAÇÃO DE MÓDULOS (v5.4.0)', desc: 'Interruptores liga-desliga por bar que ocultam dinamicamente seções de consignações e receitas no PDV e Estoque.', icon: '🔌' },
                      { title: 'RECUPERAÇÃO SEGURA (v5.4.0)', desc: 'Bypass de redefinição rápida do admin para admin123 autenticado via chave master do banco Firebase.', icon: '🔐' },
                      { title: 'ATALHO PDV SEM CONFLITO (v5.4.0)', desc: 'Remapeamento do atalho global de checkout de Espaço para F4, evitando conflitos de digitação.', icon: '⌨️' }
                    ].map((item, i) => (
                      <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
                        <div className="absolute top-4 right-4 text-2xl opacity-10 group-hover:opacity-30 transition-opacity">{item.icon}</div>
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 pr-8">{item.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-mono">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <p className="text-emerald-500 text-xs font-bold flex items-center gap-2">
                      <span className="text-white">$</span> botequista --audit-security
                    </p>
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 text-slate-400 text-xs leading-relaxed font-mono">
                      <span>[SECURITY AUDIT] Matriz de Direitos Híbrida em conformidade com as regras RTDB estritas. O tráfego de dados é blindado em trânsito com criptografia TLS 1.3 e em repouso com IndexedDB encriptado localmente. Proteção ativa contra cancelamentos suspeitos (Auditoria Anti-Fraude) e fechamento cego de caixa.</span>
                    </div>
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
              <div>BOTEQUISTA_SYSTEM_V5.5.0_STABLE</div>
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
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-300 text-sm leading-relaxed custom-scrollbar">
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
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-slate-300 text-sm leading-relaxed custom-scrollbar">
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
