import React, { useState } from 'react';

const whatsAppLink = "https://wa.me/5511966989160?text=Olá!%20Vi%20a%20landing%20page%20do%20Botequista%20e%20gostaria%20de%20ser%20um%20Beta%20Tester%20do%20sistema.";

export const LandingPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNerdModalOpen, setIsNerdModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const ComparisonRow = ({ feature, bot, trad }: { feature: string, bot: boolean, trad: boolean }) => (
    <div className="grid grid-cols-3 py-6 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors px-4">
      <div className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{feature}</div>
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
                  <span className="text-[10px] font-black tracking-[0.3em] uppercase text-red-600 -mt-1">Gestão de Elite</span>
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
                  Agendar Demo VIP
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
                Garantir Demo VIP
              </a>
            </div>
          </div>
        </nav>

        {/* HERO: The Impact Header */}
        <section className="relative pt-20 pb-32 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-[0.3em] mb-10 animate-bounce">
              🍺 PARE DE PERDER DINHEIRO NO CAOS
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] mb-8 bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent uppercase italic">
              O FIM DOS <span className="text-red-600 not-italic">DESVIOS.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
              Blinde seu caixa com <span className="text-white font-bold border-b-4 border-red-600">conferência cega e auditoria em tempo real.</span> O único sistema que nunca trava, mesmo se o Wi-Fi cair no rush.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-24">
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-full sm:w-auto bg-[#25D366] text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight transition-all hover:scale-110 shadow-[0_20px_50px_-15px_rgba(37,211,102,0.4)]"
              >
                Garantir meu Bar Pro
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto bg-slate-900/50 border border-white/10 text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight hover:bg-slate-800 transition-all backdrop-blur-xl"
              >
                Ver Recursos
              </button>
            </div>

            {/* DASHBOARD PREVIEW */}
            <div className="w-full relative px-4 max-w-6xl">
              <div className="absolute -inset-10 bg-red-600/20 blur-[120px] rounded-full opacity-50"></div>
              <div className="relative bg-slate-900 p-3 rounded-[60px] border border-white/10 shadow-3xl overflow-hidden group">
                <img 
                  src="/landing_assets/assets/dashboard_hero_v42.png" 
                  alt="Botequista Pro Dashboard" 
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
            <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter">Os Três Pilares do <span className="text-red-600">Lucro.</span></h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto">O Botequista não é apenas um software, é o gerente que nunca dorme.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pillar 1: Blindagem */}
            <div className="lg:col-span-2 group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-red-500/30 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-red-500/40">🔒</div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter">Blindagem de Caixa</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-md">
                  Acabe com as discrepâncias. Com a **Conferência Cega**, o operador conta o dinheiro sem saber o valor esperado. A **Auditoria de Timeline** registra cada cancelamento ou fechamento com prova real.
                </p>
              </div>
            </div>

            {/* Pillar 2: Velocidade */}
            <div className="group p-12 bg-white/5 border border-white/5 rounded-[60px] hover:border-emerald-500/30 transition-all duration-500 space-y-6">
              <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-emerald-500/40">⚡</div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter">Giro de Balcão</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Venda Rápida em 2 cliques. Comanda automática temporária para o cliente que quer "só uma água" agora. Velocidade é faturamento.
              </p>
            </div>

            {/* Pillar 3: Rede */}
            <div className="group p-12 bg-white/5 border border-white/5 rounded-[60px] hover:border-blue-500/30 transition-all duration-500 space-y-6">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-blue-500/40">🏢</div>
              <h3 className="text-4xl font-black uppercase italic tracking-tighter">Escala Real</h3>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Gestão de Franquias nativa. Faturamento consolidado no seu celular enquanto os dados de cada unidade permanecem blindados e isolados.
              </p>
            </div>

            {/* Pillar 4: Offline */}
            <div className="lg:col-span-2 group p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 rounded-[60px] hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-cyan-600 rounded-3xl flex items-center justify-center text-3xl shadow-2xl shadow-cyan-500/40">☁️</div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter text-cyan-400">Offline-First de Verdade</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  A internet caiu? O garçom continua lançando, o caixa continua correndo. O Botequista salva tudo localmente e sobe para o banco de dados via **Sync Queue** assim que o sinal volta. Zero perda de pedidos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-32 bg-white/[0.02] border-y border-white/5 px-4">
           <div className="max-w-4xl mx-auto">
             <div className="text-center mb-16">
               <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">Por que o <span className="text-red-600">Botequista?</span></h2>
               <p className="text-slate-500">Escolha o sistema que entende a realidade do bar, não o que brilha na vitrine.</p>
             </div>
             
             <div className="bg-slate-950 rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
               <div className="grid grid-cols-3 py-8 bg-white/5 px-4 font-black uppercase text-[12px] tracking-widest italic border-b border-white/10">
                 <div>Funcionalidade</div>
                 <div className="text-center text-red-500">Botequista Pro</div>
                 <div className="text-center opacity-40">Outros Sistemas</div>
               </div>
               <ComparisonRow feature="Vende sem Internet" bot={true} trad={false} />
               <ComparisonRow feature="Conferência Cega de Caixa" bot={true} trad={false} />
               <ComparisonRow feature="Zero Taxas de App Store" bot={true} trad={false} />
               <ComparisonRow feature="Instalação em segundos" bot={true} trad={false} />
               <ComparisonRow feature="Escala para Franquias" bot={true} trad={false} />
               <ComparisonRow feature="Auditoria de Timeline" bot={true} trad={false} />
               <ComparisonRow feature="Funciona em qualquer celular" bot={true} trad={true} />
             </div>
           </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-40 px-4 text-center relative overflow-hidden">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-red-600 to-red-900 p-20 md:p-32 rounded-[80px] shadow-3xl shadow-red-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-white/10 blur-[150px] rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="text-5xl md:text-8xl font-black mb-10 leading-[0.9] italic uppercase">Assuma o controle <br/> total do seu lucro.</h2>
              <p className="text-white/80 text-2xl mb-16 max-w-2xl mx-auto font-medium leading-relaxed">Não deixe seu bar ser gerido pelo acaso. Torne-se um Beta Tester agora e transforme sua operação.</p>
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-red-600 px-16 py-8 rounded-[30px] text-3xl font-black uppercase tracking-tight hover:scale-110 active:scale-95 transition-all shadow-3xl hover:bg-slate-100"
              >
                QUERO DEMONSTRAÇÃO VIP
              </a>
              <p className="mt-10 text-white/50 text-sm font-black uppercase tracking-widest">Atendimento direto com os fundadores</p>
            </div>
          </div>
          <button 
            onClick={() => setIsNerdModalOpen(true)}
            className="mt-20 text-slate-700 hover:text-slate-400 font-black uppercase text-xs tracking-[0.5em] transition-colors"
          >
            Curioso sobre a infraestrutura? Veja os specs para nerds.
          </button>
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-2xl font-black tracking-tighter uppercase font-barrio text-white/40">Botequista</span>
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-800">Elite Management System</span>
            </div>
            <p className="text-slate-700 text-sm font-medium italic">&copy; {new Date().getFullYear()} Botequista System. Feito para quem não para.</p>
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
              <h3 className="text-4xl font-black italic uppercase tracking-tighter">Ecossistema <span className="text-red-600">PRO</span></h3>
              <button onClick={() => setIsModalOpen(false)} className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-16 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Segurança</div>
                  <h4 className="text-2xl font-black uppercase italic">Hierarquia Granular (RBAC)</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Mais de 20 permissões individuais. O garçom não vê o faturamento, o gerente não deleta logs. O controle total é sempre seu.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Financeiro</div>
                  <h4 className="text-2xl font-black uppercase italic">Teclado ATM Nativo</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Sangrias e suprimentos feitos em segundos com teclado numérico dedicado. Sem erro de digitação, com validação de saldo proativa.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-red-500 font-black text-xs uppercase tracking-widest">Operação</div>
                  <h4 className="text-2xl font-black uppercase italic">Impressão ESC/POS</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Suporte nativo a impressoras térmicas via Web Serial. Imprima comandas e fechamentos direto do navegador, sem drivers chatos.</p>
                </div>
                <div className="space-y-4">
                   <div className="text-red-500 font-black text-xs uppercase tracking-widest">Inventário</div>
                  <h4 className="text-2xl font-black uppercase italic">Rastreio Seletivo</h4>
                  <p className="text-slate-400 text-lg leading-relaxed">Controle apenas o que importa. Itens como "couvert" ou "taxa de entrega" são marcados como serviço e não poluem seu estoque.</p>
                </div>
              </div>
              <div className="pt-10 border-t border-white/5 text-center">
                 <p className="text-slate-500 mb-8 font-bold italic">E muito mais: Curva ABC, Gestão de Fiados, Exportação PNG, Backup GitHub...</p>
                 <a href={whatsAppLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#25D366] text-white px-12 py-6 rounded-3xl text-2xl font-black uppercase tracking-tight hover:scale-110 transition-all">
                  Quero Demonstração VIP agora
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
                <span className="text-2xl">🤓</span>
                <h3 className="text-xl font-mono font-bold text-emerald-500">&gt; cat system_specs.v4.2</h3>
              </div>
              <button onClick={() => setIsNerdModalOpen(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 font-mono text-sm leading-relaxed space-y-8 text-slate-300 no-scrollbar">
               <div className="space-y-4">
                <p className="text-emerald-500 font-bold">$ botequista --check-architecture</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 border-l-2 border-slate-700 pl-6">
                  <li><span className="text-emerald-400">Runtime:</span> React 19 + TypeScript 5.8</li>
                  <li><span className="text-emerald-400">Persistence:</span> IDB Transactional Layer</li>
                  <li><span className="text-emerald-400">Encryption:</span> SHA-256 PBKDF2</li>
                  <li><span className="text-emerald-400">Sync:</span> WebSocket-like RTDB Hooks</li>
                  <li><span className="text-emerald-400">Isolation:</span> Multi-Tenant Franchise DB</li>
                  <li><span className="text-emerald-400">Hardware:</span> Web Serial API (v1.0)</li>
                </ul>
              </div>
              <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                <p className="text-emerald-500 mb-4 font-bold">$ tail redundancy_report.log</p>
                <p className="text-[11px] leading-tight text-slate-500">
                  [AUDIT] v4.2 stable release active. SyncQueue is FIFO idempotent. All deletions are soft-deleted in RTDB but hard-logged in Timeline. Offline persistence verified up to 500mb of transactions local capacity.
                </p>
              </div>
              <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">Build: Production-v4.2.0-Elite</p>
            </div>
          </div>
        </div>
      )}

      {/* Terms/Privacy Modals */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsTermsModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl p-10 shadow-3xl">
            <h3 className="text-2xl font-black uppercase mb-6">Termos de Uso</h3>
            <div className="text-slate-400 text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar text-justify font-medium">
              <p>O Botequista é um sistema em fase Beta Pro. Ao utilizar, você aceita que a estabilidade depende da correta sincronização de dados local-nuvem. A responsabilidade fiscal e tributária continua sendo exclusividade do estabelecimento usuário. Todos os dados são encriptados ponto a ponto.</p>
            </div>
            <button onClick={() => setIsTermsModalOpen(false)} className="mt-8 text-red-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Fechar Documento</button>
          </div>
        </div>
      )}

      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md" onClick={() => setIsPrivacyModalOpen(false)} />
          <div className="relative bg-[#0f172a] border border-white/10 rounded-[32px] w-full max-w-2xl p-10 shadow-3xl">
            <h3 className="text-2xl font-black uppercase mb-6">Privacidade</h3>
            <div className="text-slate-400 text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar text-justify font-medium">
              <p>Não vendemos dados. Suas informações de venda são encriptadas (AES-256) e usadas apenas para sua própria gestão interna. Logs de auditoria são mantidos por 7 dias para sua própria segurança em caso de discrepâncias de caixa ou auditorias de pessoal.</p>
            </div>
            <button onClick={() => setIsPrivacyModalOpen(false)} className="mt-8 text-red-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Fechar Documento</button>
          </div>
        </div>
      )}
    </div>
  );
};
