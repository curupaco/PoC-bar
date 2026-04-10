import React, { useState } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20a%20landing%20page%20Elite%20do%20Botequista%20e%20quero%20transformar%20meu%20bar.";

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const ComparisonRow = ({ feature, bot, trad, isNew }: { feature: string, bot: boolean, trad: boolean, isNew?: boolean }) => (
    <div className="grid grid-cols-3 py-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors px-4 relative">
      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
        {feature}
        {isNew && <span className="text-[7px] bg-red-600 text-white px-1 rounded animate-pulse">ELITE</span>}
      </div>
      <div className="text-center">{bot ? <span className="text-emerald-500 font-black">✓ SIM</span> : <span className="text-red-500 font-black">✗ NÃO</span>}</div>
      <div className="text-center opacity-40">{trad ? <span className="text-emerald-500 font-black">✓ SIM</span> : <span className="text-red-500 font-black">✗ NÃO</span>}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full opacity-40 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full opacity-30 mix-blend-screen" />
      </div>

      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-24">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="relative">
                   <div className="absolute inset-0 bg-red-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                   <svg className="w-12 h-12 relative" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <circle r="190" cx="256" cy="256" fill="#1e293b" />
                    <circle r="180" cx="256" cy="256" fill="#334155" />
                    <circle r="160" cx="256" cy="256" fill="#ef4444" />
                    <path fill="#ffffff"
                      d="M-35 -70 H 25 C 55 -70 75 -50 75 -20 C 75 0 60 15 40 20 C 65 25 80 45 80 75 C 80 110 55 130 15 130 H -35 V -70 Z M 0 -40 V 10 H 25 C 40 10 45 0 45 -15 C 45 -30 40 -40 25 -40 H 0 Z M 0 40 V 100 H 30 C 50 100 50 90 50 70 C 50 50 45 40 30 40 H 0 Z"
                      transform="translate(256 256) translate(-15 -10) scale(0.8)" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tighter uppercase font-barrio bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Botequista</span>
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase text-red-600 -mt-1">v4.3 Elite Powerhouse</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-10">
                <button onClick={() => setIsNerdModalOpen(true)} className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Tech Specs</button>
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-slate-950 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 shadow-2xl shadow-white/5 active:scale-95"
                >
                  Agendar Demo Elite
                </a>
              </div>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden text-white p-2"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Overlay */}
          <div className={`fixed inset-0 z-40 lg:hidden bg-[#020617]/98 backdrop-blur-2xl transition-all duration-500 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col items-center justify-center h-full gap-8 p-4">
              <button onClick={() => { setIsNerdModalOpen(true); setIsMenuOpen(false); }} className="text-xl font-black uppercase tracking-widest text-slate-400 hover:text-white">Tech Specs 🤓</button>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="w-full max-w-xs bg-red-600 text-white px-8 py-4 rounded-2xl text-center text-lg font-black uppercase tracking-tight"
              >
                Garantir Demo Elite
              </a>
            </div>
          </div>
        </nav>

        {/* HERO: The Impact Header */}
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-[0.3em] mb-10 animate-bounce">
              🚀 PERFORMANCE ELITE v4.3 LIBERADA
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic">
              GESTÃO DE <span className="text-red-600 not-italic">ALTA </span> PERFORMANCE.
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-400 max-w-4xl mx-auto mb-16 leading-relaxed font-medium">
              Transforme seu bar em uma potência com <span className="text-white font-bold border-b-4 border-red-600">inteligência de dados, atalhos de elite e zero gargalo.</span> O Botequista v4.3 chegou para quem não aceita lucro médio.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-24">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full sm:w-auto bg-[#25D366] text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight transition-all hover:scale-110 shadow-[0_20px_50px_-15px_rgba(37,211,102,0.4)]"
              >
                Quero o Botequista Elite
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-slate-900/50 border border-white/10 text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight hover:bg-slate-800 transition-all backdrop-blur-xl"
              >
                Ver Novos Recursos
              </button>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="w-full relative px-4 max-w-6xl">
              <div className="absolute -inset-10 bg-red-600/20 blur-[120px] rounded-full opacity-50"></div>
              <div className="relative bg-slate-900 p-3 rounded-[60px] border border-white/10 shadow-3xl overflow-hidden group">
                <img 
                  src="/landing_assets/assets/dashboard_hero_v43_elite.png" 
                  alt="Botequista Elite Dashboard" 
                  className="rounded-[50px] w-full h-auto object-cover opacity-90 group-hover:scale-[1.01] transition-transform duration-1000 shadow-inner" 
                />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020617] to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS: Bento Grid Section */}
        <section className="py-32 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">Domine Cada <span className="text-red-600">Centavo.</span></h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto">Novas funcionalidades Elite projetadas para quem busca escala e controle absoluto.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Elite 1: Team Ranking */}
            <div className="group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-red-500/30 transition-all duration-500 flex flex-col justify-between overflow-hidden">
              <div className="space-y-6">
                 <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-3xl shadow-red-500/40 shadow-2xl">📊</div>
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter">Ranking de Equipe</h3>
                 <p className="text-slate-400 text-lg leading-relaxed font-medium">
                   Visualize em tempo real quem são seus garçons que mais vendem. Estimule a competição saudável e aumente o faturamento com dados.
                 </p>
              </div>
              <span className="mt-8 text-[10px] font-black uppercase text-red-500 tracking-widest">NOVO EM v4.3</span>
            </div>

            {/* Elite 2: Heatmap */}
            <div className="group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-emerald-500/30 transition-all duration-500 flex flex-col justify-between">
              <div className="space-y-6">
                 <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-emerald-500/40 shadow-2xl">🔥</div>
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter">Heatmap de Fluxo</h3>
                 <p className="text-slate-400 text-lg leading-relaxed font-medium">
                    Descubra seus horários de pico reais com gráficos de densidade por hora. Otimize sua equipe e reduza desperdícios na cozinha.
                 </p>
              </div>
              <span className="mt-8 text-[10px] font-black uppercase text-emerald-500 tracking-widest">NOVO EM v4.3</span>
            </div>

            {/* Elite 3: Keyboard Ninja */}
            <div className="group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-blue-500/30 transition-all duration-500 flex flex-col justify-between text-white">
              <div className="space-y-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-blue-500/40 shadow-2xl">⌨️</div>
                 <h3 className="text-3xl font-black uppercase italic tracking-tighter">Atalhos de Elite</h3>
                 <p className="text-slate-400 text-lg leading-relaxed font-medium">
                    Atendimento na velocidade da luz. Use atalhos de teclado (`F1`, `F2`, `Espaço`) para operar o sistema sem tocar no mouse.
                 </p>
              </div>
              <span className="mt-8 text-[10px] font-black uppercase text-blue-500 tracking-widest">NOVO EM v4.3</span>
            </div>

            {/* Multi-Unidades */}
            <div className="lg:col-span-2 group p-12 bg-white/5 border border-white/5 rounded-[60px] hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-cyan-600 rounded-3xl flex items-center justify-center text-3xl shadow-cyan-500/40 shadow-2xl">🏢</div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-cyan-400">Escala de Franquias</h3>
                <p className="text-slate-400 text-xl leading-relaxed font-medium max-w-2xl">
                  Gerencia 2, 10 ou 50 bares? O Botequista Elite isola os dados de cada unidade mas entrega um Dashboard centralizado para o dono. Controle sua rede de onde estiver.
                </p>
              </div>
            </div>

             {/* Pillar 4: Offline */}
             <div className="group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
               <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-3xl shadow-amber-500/40 shadow-2xl">☁️</div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-amber-500">Offline Nativo</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  Se a internet cair, o bar não para. O Botequista Elite salva tudo localmente e sincroniza o caixa proativamente assim que o sinal volta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-32 bg-white/[0.02] border-y border-white/5 px-4">
           <div className="max-w-4xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">O Upgrade que seu Bar <span className="text-red-600">Merece.</span></h2>
               <p className="text-slate-500">Comparativo Elite vs Sistemas Tradicionais de Bar.</p>
             </div>
             
             <div className="bg-slate-950 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
               <div className="grid grid-cols-3 py-8 bg-white/5 px-4 font-black uppercase text-[12px] tracking-widest italic border-b border-white/10">
                 <div>Funcionalidade</div>
                 <div className="text-center text-red-500">Botequista Elite</div>
                 <div className="text-center opacity-40">Outros Sistemas</div>
               </div>
               <ComparisonRow feature="Ranking de Performance Garçom" bot={true} trad={false} isNew />
               <ComparisonRow feature="Mapa de Calor (Pico de Vendas)" bot={true} trad={false} isNew />
               <ComparisonRow feature="Atalhos Profissionais de Teclado" bot={true} trad={false} isNew />
               <ComparisonRow feature="Alertas de Mesa Ociosa" bot={true} trad={false} isNew />
               <ComparisonRow feature="Backup Automático Pós-Turno" bot={true} trad={false} isNew />
               <ComparisonRow feature="Recibo via WhatsApp" bot={true} trad={false} isNew />
               <ComparisonRow feature="Vende sem Internet" bot={true} trad={false} />
               <ComparisonRow feature="Conferência Cega de Caixa" bot={true} trad={false} />
               <ComparisonRow feature="Zero Taxas de App Store" bot={true} trad={false} />
             </div>
           </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-40 px-4 text-center relative overflow-hidden">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-red-600 to-red-900 p-20 md:p-32 rounded-[80px] shadow-3xl shadow-red-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-white/10 blur-[150px] rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-5xl md:text-8xl font-black mb-10 leading-[0.9] italic uppercase text-white">A potência do <br/> seu bar começa aqui.</h2>
              <p className="text-white/80 text-2xl mb-16 max-w-2xl mx-auto font-medium leading-relaxed">Assuma hoje o controle absoluto. Menos erro, mais giro, lucro elite.</p>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-600 px-16 py-8 rounded-[30px] text-3xl font-black uppercase tracking-tight hover:scale-110 active:scale-95 transition-all shadow-3xl hover:bg-slate-100"
              >
                QUERO DEMONSTRAÇÃO ELITE
              </a>
              <p className="mt-10 text-white/50 text-[10px] font-black uppercase tracking-[0.4em]">Atendimento VIP direto com os fundadores</p>
            </div>
          </div>
          <button 
            onClick={() => setIsNerdModalOpen(true)}
            className="mt-20 text-slate-700 hover:text-slate-400 font-black uppercase text-xs tracking-[0.5em] transition-colors"
          >
            Curioso sobre os algoritmos? Veja os specs v4.3.
          </button>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-2xl font-black tracking-tighter uppercase font-barrio text-white/40">Botequista</span>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-800 italic">v4.3 Elite Engine</span>
            </div>
            <p className="text-slate-700 text-xs font-medium italic">&copy; {new Date().getFullYear()} Botequista Elite. Revolucionando a boemia.</p>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-700">
               <a href="https://www.instagram.com/obotequista/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">INSTAGRAM</a>
               <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-white transition-colors">TERMOS</button>
               <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-white transition-colors">PRIVACIDADE</button>
            </div>
          </div>
        </footer>

      </div>

      {/* Main Feature Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 font-sans">
          <div className="absolute inset-0 bg-[#020617]/98 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-[#0a0f1e] border border-white/10 rounded-[60px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-3xl flex flex-col animate-in zoom-in-95 duration-500">
            <div className="p-10 flex justify-between items-center border-b border-white/5">
              <h3 className="text-4xl font-black italic uppercase tracking-tighter">Arsenal <span className="text-red-600">ELITE v4.3</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-16 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Analytics Elite</div>
                  <h4 className="text-2xl font-black uppercase italic">Performance de Garçom</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Ranking automático de vendas por atendente. Saiba quem são seus garçons de elite com gráficos claros e auditáveis.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Operação Turbo</div>
                  <h4 className="text-2xl font-black uppercase italic">Saideira com 1-Clique</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Botão dedicado para repetir instantaneamente os últimos itens lançados em uma comanda. Velocidade e satisfação do cliente.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Financeiro</div>
                  <h4 className="text-2xl font-black uppercase italic">Recibos via WhatsApp</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Gere comprovantes profissionais em texto formatado e envie direto para o smartphone do cliente via Web Share.</p>
                </div>
                <div className="space-y-4">
                   <div className="text-red-500 font-black text-xs uppercase tracking-widest">Segurança</div>
                  <h4 className="text-2xl font-black uppercase italic">Backup Ativo Pós-Turno</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Fluxo proativo: ao fechar o caixa, o sistema solicita a geração de um backup .json para sua garantia total de dados.</p>
                </div>
              </div>
              <div className="pt-10 border-t border-white/5 text-center">
                 <p className="text-slate-500 mb-8 font-bold italic">E mais 30 outros recursos projetados exclusivamente para a realidade frenética de bares.</p>
                 <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight hover:scale-110 transition-all">
                  Quero demonstração Elite agora
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}

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
                   <li><span className="text-emerald-400">Heatmap Engine:</span> SVG Density Gradients</li>
                   <li><span className="text-emerald-400">Ranking Algorithm:</span> Sales Per User Vector</li>
                   <li><span className="text-emerald-400">Shortcuts:</span> Native Event Listener (v2.0)</li>
                   <li><span className="text-emerald-400">Idle Detection:</span> Table Inactivity TTL</li>
                   <li><span className="text-emerald-400">Cloud Sync:</span> Idempotent FIFO Queue</li>
                   <li><span className="text-emerald-400">Export:</span> Web Share API v2 Support</li>
                 </ul>
               </div>
               <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                 <p className="text-emerald-500 mb-4 font-bold">$ tail elite_release_notes.log</p>
                 <p className="text-[11px] leading-tight text-slate-500">
                   [STABLE] v4.3 Elite Engine deployed. Memory-efficient rendering for heatmaps. Low-latency POS shortcuts enabled. Atomic bulk-settlement logic verified. Stock alerts now using proactive diff-checks.
                 </p>
               </div>
               <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">Build: Production-v4.3.0-Elite-Powerhouse</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms/Privacy Modals */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsTermsModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl p-10 shadow-3xl">
            <h3 className="text-2xl font-black uppercase mb-6 text-white">Termos de Uso Elite</h3>
            <div className="text-slate-400 text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar text-justify font-medium">
              <p>O Botequista Elite é um sistema de alto desempenho. Ao utilizar a versão 4.3, o contratante reconhece que a responsabilidade operacional e fiscal é exclusiva do estabelecimento. A exportação de dados via WhatsApp é um recurso de comodidade e não substitui notas fiscais obrigatórias por lei.</p>
            </div>
            <button onClick={() => setIsTermsModalOpen(false)} className="mt-8 text-red-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Fechar Documento</button>
          </div>
        </div>
      )}

      {/* Privacy Modals */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsPrivacyModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl p-10 shadow-3xl">
            <h3 className="text-2xl font-black uppercase mb-6 text-white">Privacidade Elite</h3>
            <div className="text-slate-400 text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar text-justify font-medium">
              <p>Segurança Máxima: Seus dados de faturamento e performance de equipe são encriptados de ponta a ponta. Não compartilhamos estatísticas comerciais com terceiros. Backups gerados localmente (.json) são de inteira responsabilidade do usuário quanto ao seu armazenamento seguro.</p>
            </div>
            <button onClick={() => setIsPrivacyModalOpen(false)} className="mt-8 text-red-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Fechar Documento</button>
          </div>
        </div>
      )}
    </div>
  );
};
