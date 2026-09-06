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
  { src: '/landing_assets/assets/reports_real.png', label: 'Drinks & Batches', desc: 'Central de coquetelaria: CMV automático, margem alvo, produção de xaropes artesanais e controle de quebras.' },
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
      <nav className="sticky top-0 z-50 bg-[#020617]/85 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-barrio text-xl shadow-lg shadow-red-600/20">B</div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter uppercase font-barrio leading-none">Botequista</span>
              <span className="text-[7px] font-black tracking-[0.4em] uppercase text-red-500 italic">Simplicidade & Inteligência de Balcão</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => scrollToSection('problema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">O Problema</button>
            <button onClick={() => scrollToSection('solucao')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Solução</button>
            <button onClick={() => scrollToSection('coquetelaria')} className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <span>🍸</span> Coquetelaria
            </button>
            <button onClick={() => scrollToSection('sistema')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Sistema</button>
            <button onClick={() => scrollToSection('preco')} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">Preço</button>
            <button onClick={() => setIsTechConsoleModalOpen(true)} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 hover:text-white transition-colors">🤓 Tech</button>
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
            <button onClick={() => scrollToSection('coquetelaria')} className="text-xl font-black uppercase tracking-widest text-amber-400 hover:text-amber-300 flex items-center gap-2">
              <span>🍸</span> Coquetelaria & Drinks
            </button>
            <button onClick={() => scrollToSection('sistema')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Sistema</button>
            <button onClick={() => scrollToSection('preco')} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">Preço</button>
            <button onClick={() => { setIsTechConsoleModalOpen(true); setIsMenuOpen(false); }} className="text-xl font-black uppercase tracking-widest text-slate-200 hover:text-white">🤓 Tech</button>
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
            <FeatureCard icon="🧠" title="Assistente do Dono (Premium)" desc="Painel offline de inteligência de negócios com faturamento, CMV, Lucro Real, Matriz BCG de cardápio, simulador de preços e auditoria de riscos operacionais." accent="emerald" />
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
              'Clube de Assinaturas e Recorrência CRM (v5.5.0)',
              'Score de Risco & Prevenção de Fraudes de Atendente (v5.5.0)',
              'Módulo de Drinks & Insumos Fracionados 2.0 (v5.7.0)',
              'Engenharia de Cardápio com CMV ao Vivo & Margem Alvo (v5.7.0)',
              'Sub-preparos & Batches Artesanais com Validade (v5.7.0)',
              'Auditoria e Prevenção de Perdas de Bar em R$ (v5.7.0)',
              'Registro de Perda & Desperdício (v5.0.0)',
              'Ativação/Desativação de Módulos (Drinks e Hospedaria) por Bar (v5.4.0)',
              'Redefinição Segura de Senha do Admin via Firebase Master Key (v5.4.0)',
              'Remapeamento do Atalho do PDV de Espaço para F4 (v5.4.0)',
              'Hospedaria de Quartos & Ciclos de Limpeza Cronometrados (v5.4.0)',
              'API Rate Limiting e Proteção de Borda Vercel Edge (v5.3.0)',
              'Isolamento de Namespace do LocalStorage com safeLocalStorage (v5.3.0)',
              'Centralização do Controle de Admin via React Context e useIsAdmin() (v5.3.0)',
              'Radar de Prejuízo (Margem < 30%) (v4.9.0)',
              'Smart Stock Híbrido & Hot Items (v4.9.0)',
              'Previsão de Movimento por Clima & Demanda (v5.2.0)',
              'Matriz de Permissionamentos Híbrida & Retrocompatível (v5.2.0)',
              'Detector de Garçom Esperto por Ticket Médio (v5.1.0)',
              'Badge Mobile da Unidade Ativa no Header (v5.1.0)',
              'Régua de Cobrança com 1 Clique no WhatsApp (v5.1.0)',
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
              { title: 'Detector de Mesa Travada', desc: 'O sistema avisa quais mesas estão ocupando espaço sem consuming. Sugestão visual de saideira para aumentar o giro.', icon: '⏰', tag: 'OPERACIONAL' },
              { title: 'Radar de Prejuízo', desc: 'Cruza custos e vendas, alertando se a margem de algum item de alto giro cair abaixo de 30% para você precificar melhor.', icon: '📈', tag: 'INTELIGÊNCIA' },
              { title: 'Smart Stock Híbrido', desc: 'Estoque crítico estimado em horas de consumo para itens controlados, e alertas de Alta Demanda (Hot Items) para produtos comuns.', icon: '⏳', tag: 'ESTOQUE' },
              { title: 'Cardápio Digital QR', desc: 'Gere um link para os clientes visualizarem seu menu atualizado direto no celular, sem baixar nada.', icon: '📱', tag: 'ATENDIMENTO' },
              { title: 'Blindagem Anti-Fraude', desc: 'Proteção visual e funcional da conta mestre. Log de auditoria que registra cada fechamento de caixa.', icon: '🛡️', tag: 'SEGURANÇA' },
              { title: 'Gestão de Fiado (Pendura)', desc: 'Histórico de consumo de cada cliente. Régua de cobrança educada para reaver valores pendentes com organização.', icon: '📋', tag: 'GESTÃO' },
              { title: 'Controle de Desperdício', desc: 'Registre perdas por validade, quebra ou consumo da equipe. Acompanhe gráficos dinâmicos de ralo de caixa e proteja suas margens.', icon: '🚨', tag: 'ESTOQUE' },
              { title: 'Previsão de Movimento', desc: 'Cruza histórico do dia da semana e tempo real do clima via geolocalização para checklist inteligente de insumos.', icon: '🌤️', tag: 'OPERAÇÃO' },
              { title: 'Matriz de Direitos Híbrida', desc: 'Permissões granulares de acesso com camada de retrocompatibilidade para contas legadas herdarem direitos sem lockout.', icon: '🔑', tag: 'SEGURANÇA' },
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

      {/* ─── COQUETELARIA & DRINKS 2.0 SHOWCASE ─── */}
      <CocktailLabShowcase />

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
              { f: 'Controle de Perdas & Desperdício', b: true, t: false },
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
