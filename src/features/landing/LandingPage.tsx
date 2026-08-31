import React, { useState } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20a%20landing%20page%20Elite%20do%20Botequista%20e%20quero%20transformar%20meu%20bar.";

const BrowserFrame: React.FC<{ src: string, alt: string, label?: string }> = ({ src, alt, label }) => (
  <div className="relative group reveal w-full max-w-full mx-auto">
    {label && (
      <div className="absolute -top-10 lg:-top-12 left-0 flex items-center gap-2 px-3 lg:px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full z-20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-emerald-500">{label}</span>
      </div>
    )}
    <div className="rounded-[24px] lg:rounded-[32px] bg-slate-800 p-1.5 lg:p-2 shadow-3xl border border-white/5 overflow-hidden w-full">
      <div className="bg-slate-900 h-8 lg:h-10 flex items-center px-4 lg:px-6 gap-2 rounded-t-[18px] lg:rounded-t-[24px]">
        <div className="flex gap-1">
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-red-500/30"></div>
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-amber-500/30"></div>
          <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-emerald-500/30"></div>
        </div>
        <div className="flex-1 max-w-[120px] lg:max-w-xs mx-auto bg-slate-950/50 h-4 lg:h-5 rounded-full border border-white/5 flex items-center px-2 lg:px-3">
          <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500/40 mr-2"></div>
          <span className="text-[6px] lg:text-[8px] font-mono text-slate-600 truncate">botequista.app/elite</span>
        </div>
      </div>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
  </div>
);

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const ComparisonRow = ({ feature, bot, trad, isNew }: { feature: string, bot: boolean, trad: boolean, isNew?: boolean }) => (
    <div className="grid grid-cols-3 py-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors px-4 group">
      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 group-hover:text-white transition-colors">
        {feature}
        {isNew && <span className="text-[7px] bg-red-600 text-white px-1 rounded animate-pulse">ELITE</span>}
      </div>
      <div className="text-center">{bot ? <span className="text-emerald-500 font-black">✓ SIM</span> : <span className="text-red-500 font-black">✗ NÃO</span>}</div>
      <div className="text-center opacity-40">{trad ? <span className="text-emerald-500 font-black">✓ SIM</span> : <span className="text-red-500 font-black">✗ NÃO</span>}</div>
    </div>
  );

  const PlanCard = ({ title, price, features, highlight = false, badge }: { title: string, price: string, features: string[], highlight?: boolean, badge?: string }) => (
    <div className={`p-10 rounded-[40px] border ${highlight ? 'bg-red-600 border-red-500 shadow-2xl shadow-red-600/20 scale-105 z-10' : 'bg-slate-900/50 border-white/10 hover:border-white/20'} transition-all flex flex-col relative`}>
      {badge && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-slate-950 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">{badge}</span>}
      <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 opacity-70">{title}</h3>
      <div className="flex items-baseline gap-1 mb-8">
        <span className="text-2xl font-black">R$</span>
        <span className="text-6xl font-black tracking-tighter">{price}</span>
        <span className="text-xs font-bold opacity-60">/mês</span>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm font-medium">
            <svg className={`w-5 h-5 ${highlight ? 'text-white' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            <span className={highlight ? 'text-white' : 'text-slate-300'}>{f}</span>
          </li>
        ))}
      </ul>
      <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className={`w-full py-4 rounded-2xl text-center font-black uppercase tracking-widest text-xs transition-all ${highlight ? 'bg-white text-red-600 hover:bg-slate-100' : 'bg-white/10 text-white hover:bg-white/20'}`}>
        Começar Agora
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-red-600/5 blur-[150px] rounded-full opacity-40 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[800px] h-[800px] bg-emerald-600/5 blur-[150px] rounded-full opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-barrio text-2xl">B</div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter uppercase font-barrio">Botequista</span>
                <span className="text-[8px] font-black tracking-[0.4em] uppercase text-red-600 -mt-1 italic">Powerhouse v5.6.0</span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-12">
              <a href="#recursos" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Recursos</a>
              <a href="#precos" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Preços</a>
              <button onClick={() => setIsNerdModalOpen(true)} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Tech Specs</button>
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-950 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl">
                Agendar Demo
              </a>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
          </div>
          <div className={`fixed inset-0 z-40 lg:hidden bg-[#020617]/98 backdrop-blur-2xl transition-all duration-500 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
              <a href="#recursos" onClick={() => setIsMenuOpen(false)} className="text-xl font-black uppercase tracking-widest text-slate-400 hover:text-white">Recursos</a>
              <a href="#precos" onClick={() => setIsMenuOpen(false)} className="text-xl font-black uppercase tracking-widest text-slate-400 hover:text-white">Preços</a>
              <button onClick={() => { setIsNerdModalOpen(true); setIsMenuOpen(false); }} className="text-xl font-black uppercase tracking-widest text-slate-400 hover:text-white">Tech Specs 🤓</button>
              <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="w-full max-w-xs bg-red-600 text-white px-8 py-4 rounded-2xl text-center text-lg font-black uppercase tracking-tight">Agendar Demo Elite</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="pt-24 pb-48 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="reveal">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                🚀 Gestão de Alta Performance
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
                GESTÃO <span className="text-red-600 not-italic">HONESTA</span> DE VERDADE.
              </h1>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium max-w-xl">
                O Botequista Elite entrega <span className="text-white font-bold">velocidade ninja e clareza total.</span> Sem promessas vazias — veja fotos reais do que você terá no seu balcão.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="group bg-[#25D366] text-white px-12 py-6 rounded-3xl text-xl font-black uppercase tracking-tight transition-all hover:scale-110 shadow-3xl shadow-emerald-900/40 text-center">
                  Quero Vender Mais
                </a>
              </div>
            </div>
            <div className="pt-12">
               <BrowserFrame 
                 src="/landing_assets/assets/dashboard_real.png" 
                 alt="Dashboard Real Botequista" 
                 label="Interface Real do Sistema"
               />
            </div>
          </div>
        </section>

        {/* SHOWCASE POS */}
         <section id="recursos" className="py-32 px-6 bg-white/[0.01]">
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                 <BrowserFrame 
                   src="/landing_assets/assets/pos_real.png" 
                   alt="POS Real Botequista" 
                   label="O PDV mais rápido do mercado"
                 />
              </div>
              <div className="order-1 lg:order-2 space-y-8 reveal">
                 <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">OPERAÇÃO <span className="text-red-600">NINJA.</span></h2>
                 <p className="text-slate-400 text-xl font-medium leading-relaxed">
                    Esqueça o mouse. Com o **Modo Rápido** e a **Repetição de Saideira**, um garçom lança um pedido em menos de 2 segundos.
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl">
                       <h4 className="font-black uppercase text-[10px] text-red-500 mb-2">Repetir Saideira</h4>
                       <p className="text-slate-500 text-xs">Botão dedicado para repetir instantaneamente os últimos itens de uma comanda.</p>
                    </div>
                    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl">
                       <h4 className="font-black uppercase text-[10px] text-red-500 mb-2">Favoritos</h4>
                       <p className="text-slate-500 text-xs">Acesso imediato aos itens que mais giram no seu bar (Heineken, Original, Porções).</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* SHOWCASE REPORTS */}
        <section className="py-32 px-6">
           <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-8 reveal">
                 <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">CONTROLE <span className="text-red-600">DE ELITE.</span></h2>
                 <p className="text-slate-400 text-xl font-medium leading-relaxed">
                    Tenha visibilidade total do seu lucro. Relatórios de **Fechamento**, **Audit** e **Penduras** (Fiados) organizados em uma única tela potente.
                 </p>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                       <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Gestão Ativa de Penduras</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                       <span className="text-sm font-bold uppercase tracking-widest text-slate-300">Exportação de Relatório PNG</span>
                    </div>
                 </div>
              </div>
              <div>
                 <BrowserFrame 
                   src="/landing_assets/assets/reports_real.png" 
                   alt="Relatórios Reais Botequista" 
                   label="Inteligência de Dados"
                 />
              </div>
           </div>
        </section>

        {/* MESA OCIOSA HIGHLIGHT */}
        <section className="py-32 px-6 bg-red-600/5 border-y border-red-600/10 mb-20">
           <div className="max-w-5xl mx-auto text-center space-y-8">
              <div className="w-20 h-20 bg-red-600 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-8 shadow-3xl shadow-red-600/40">⏳</div>
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter">ZERO MESAS <span className="text-red-600">PARADAS.</span></h2>
              <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-3xl mx-auto italic">
                 Exclusivo do Elite v4.3: Sinalização visual de **Mesa Ociosa ++**. Saiba no ato qual mesa parou de consumir e aumente seu faturamento médio.
              </p>
           </div>
        </section>

        {/* COMPARISON */}
        <section className="py-32 px-6">
           <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-16 underline decoration-white/10 underline-offset-8">A Diferença é Brutal.</h2>
              <div className="bg-slate-950 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl text-left">
                <div className="grid grid-cols-3 py-8 bg-white/5 px-8 font-black uppercase text-[12px] tracking-widest italic border-b border-white/10">
                  <div>Funcionalidade</div>
                  <div className="text-center text-red-500 font-black">Botequista Elite</div>
                  <div className="text-center opacity-40">Outros Sistemas</div>
                </div>
                <ComparisonRow feature="Clube de Assinaturas e Recorrência (CRM)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Score de Risco & Prevenção de Fraudes" bot={true} trad={false} isNew />
                <ComparisonRow feature="Previsão de Movimento por Clima & Demanda" bot={true} trad={false} isNew />
                <ComparisonRow feature="Matriz de Permissionamentos Híbrida" bot={true} trad={false} isNew />
                <ComparisonRow feature="Perdas & Desperdício (Descarte)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Detector de Garçom Esperto (Ticket Médio)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Badge Mobile da Unidade Ativa" bot={true} trad={false} isNew />
                <ComparisonRow feature="Sinalização de Mesa Ociosa" bot={true} trad={false} isNew />
                <ComparisonRow feature="PDV Ninja (Atalhos + Modo Rápido)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Dashboard Multi-Unidades Real" bot={true} trad={false} isNew />
                <ComparisonRow feature="Radar de Prejuízo (Margem < 30%)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Smart Stock Híbrido (Hot Items)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Cobrança 1-Clique no WhatsApp (Pendura)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Monitor de Cozinha Reativo (Ding! 🛎️)" bot={true} trad={false} isNew />
                <ComparisonRow feature="Funcionamento Offline Nativo" bot={true} trad={false} />
                <ComparisonRow feature="Exportação via WhatsApp" bot={true} trad={true} />
              </div>
           </div>
        </section>

        {/* PRICING */}
        <section id="precos" className="py-32 px-6">
           <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20 space-y-4">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter">ACESSO <span className="text-red-600">ELITE</span> GRÁTIS.</h2>
                <p className="text-slate-500 font-bold max-w-xl mx-auto">Queremos parceiros, não apenas clientes. Use o poder do Botequista Elite sem custos iniciais.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PlanCard title="Startup" price="0" badge="GRÁTIS" features={['1 Unidade', 'PDV Offline', 'Recibos via WhatsApp', 'Estoque Básico']} />
                <PlanCard title="Elite Powerhouse" highlight price="0" badge="O MAIS POPULAR" features={['Unidades Ilimitadas', 'Curva ABC Full', 'Radar de Prejuízo (v5.2.0)', 'Smart Stock Híbrido (v5.2.0)', 'Atalhos Profissionais', 'Suporte Prioritário']} />
                <PlanCard title="Enterprise" price="0" badge="ESCALA" features={['Controle de Franquias', 'White Label (Sob consulta)', 'Consultoria de Fluxo', 'API Dedicada']} />
              </div>
              <div className="mt-16 p-8 rounded-[40px] bg-white/5 border border-white/10 max-w-2xl mx-auto text-center italic">
                 <p className="text-slate-400 text-sm font-medium">"Estamos em fase de expansão acelerada. O Botequista Elite é gratuito para os primeiros adotantes que nos ajudarem a moldar o futuro do setor. Sem cartão de crédito."</p>
              </div>
           </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-32 px-6 bg-white/[0.01]">
           <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { n: 'Ricardo, Bar do Galego', q: 'O sistema não trava nunca. O atalho de teclado mudou a vida dos meus garçons no auge do sábado.' },
                   { n: 'Mariana, Sunset Lounge', q: 'A Curva ABC me mostrou que eu estava perdendo dinheiro com uma marca de cerveja que eu achava ser a melhor.' },
                   { n: 'Ozzy, Botequim Gourmet', q: 'Gerencio minhas 3 unidades com um clique. A segurança do backup e do offline é paz de espírito.' }
                 ].map((t, i) => (
                   <div key={i} className="p-10 rounded-[40px] bg-slate-900/50 border border-white/5 space-y-6 italic hover:border-red-500/30 transition-colors">
                      <div className="text-2xl text-red-600 font-black">"</div>
                      <p className="text-slate-300 font-medium leading-relaxed">{t.q}</p>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 not-italic">— {t.n}</div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* FAQ */}
        <section className="py-32 px-6">
           <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-center mb-16 underline decoration-red-600 underline-offset-8">Tira-Dúvidas Elite</h2>
              {[
                { q: 'O sistema funciona se eu ficar sem internet?', a: 'Sim! Nosso motor PWA salva todas as vendas localmente no navegador (IndexedDB). Assim que você reconectar, os dados sobem sozinhos.' },
                { q: 'Preciso comprar equipamentos caros?', a: 'O Botequista roda em qualquer tablet, computador ou celular moderno. Recomendamos apenas um teclado para usar o potencial total dos atalhos ninja.' },
                { q: 'Quanto tempo leva para configurar?', a: 'Temos um guia interno passo-a-passo. Em menos de 15 minutos você importa seu cardápio e já pode começar a vender.' }
              ].map((faq, i) => (
                <div key={i} className="group border-b border-white/10 pb-6 cursor-pointer" onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}>
                   <div className="flex justify-between items-center text-lg font-black uppercase italic tracking-tight mb-2 group-hover:text-red-500 transition-colors">
                      {faq.q} <span className="text-2xl font-black">{activeFAQ === i ? '-' : '+'}</span>
                   </div>
                   {activeFAQ === i && <p className="text-slate-500 font-medium animate-in fade-in slide-in-from-top-2">{faq.a}</p>}
                </div>
              ))}
           </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-40 px-6 text-center">
          <div className="max-w-4xl mx-auto p-20 bg-gradient-to-br from-red-600 to-red-900 rounded-[80px] shadow-3xl shadow-red-900/40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] italic uppercase text-white reveal">Transforme seu <br/> balcão hoje.</h2>
            <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-white text-red-600 px-16 py-8 rounded-[30px] text-2xl font-black uppercase tracking-tight hover:scale-110 active:scale-95 transition-all shadow-3xl">Ativar Modo Elite</a>
            <p className="mt-8 text-white/50 text-[10px] font-black uppercase tracking-[0.4em]">Honestidade total. Performance garantida.</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-20 border-t border-white/5 opacity-40">
           <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
              <span className="text-2xl font-black uppercase font-barrio">Botequista</span>
              <p className="text-xs font-bold font-barrio">&copy; {new Date().getFullYear()} Botequista Elite Engine.</p>
              <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] font-barrio">
                 <a href="#" className="hover:text-red-500 transition-colors">Privacidade</a>
                 <a href="#" className="hover:text-red-500 transition-colors">Termos</a>
              </div>
           </div>
        </footer>
      </div>

      {/* Nerd Modal (Tech Specs) */}
      {isNerdModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-md animate-in fade-in" onClick={() => setIsNerdModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
              <div className="flex items-center gap-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-xl font-mono font-bold text-emerald-500">&gt; cat system_specs.v4.3_elite</h3>
              </div>
              <button onClick={() => setIsNerdModalOpen(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 font-mono text-sm leading-relaxed space-y-8 text-slate-300 no-scrollbar">
               <div className="space-y-4">
                 <p className="text-emerald-500 font-bold">$ elite --check-features</p>
                 <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-slate-700 pl-6">
                   <li><span className="text-emerald-400">Offline Stack:</span> IndexedDB + PWA Cache</li>
                   <li><span className="text-emerald-400">Database:</span> Realtime Firebase Core</li>
                   <li><span className="text-emerald-400">Front:</span> React 19 + Tailwind CSS</li>
                   <li><span className="text-emerald-400">Security:</span> AES-256 local encryption</li>
                 </ul>
               </div>
               <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                 <p className="text-emerald-500 mb-4 font-bold">$ log --show-performance</p>
                 <p className="text-[11px] leading-tight text-slate-500">Check-out latency: &lt; 50ms. Rendering: Optimized via React 19. Memory footprint: Minimal.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
