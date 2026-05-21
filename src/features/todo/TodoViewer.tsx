import React, { useState, useEffect, useMemo } from 'react';
import todoContent from '../../../_TODO.md?raw';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'CRÍTICO' | 'ERRO' | 'UX' | 'NORMAL';
  details: string[];
  codeBlock?: string;
  category: string;
  subcategory: string;
}

interface SectionStats {
  total: number;
  completed: number;
}

export const TodoViewer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Dynamic SEO Protection: Injetar metatags de noindex/nofollow
  useEffect(() => {
    // 1. Configurar título amigável e limpo na aba do navegador
    document.title = 'Roadmap Estratégico - Botequista';

    // 2. Injetar tag robots para evitar qualquer indexação do Google
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow, noarchive, nosnippet';
    document.head.appendChild(metaRobots);

    return () => {
      document.head.removeChild(metaRobots);
    };
  }, []);

  // Parser Avançado do _TODO.md
  const parsedData = useMemo(() => {
    const lines = todoContent.split('\n');
    const tasks: Task[] = [];
    
    let currentMainSection = 'Outros';
    let currentSubcategory = 'Geral';
    let currentTask: Task | null = null;
    let insideCodeBlock = false;
    let codeContent: string[] = [];

    let idCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Ignorar linhas vazias no processamento de topo, a menos que estejamos em bloco de código
      if (!trimmed && !insideCodeBlock) continue;

      // Detectar início/fim de blocos de código
      if (trimmed.startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          if (currentTask) {
            currentTask.codeBlock = codeContent.join('\n');
          }
          codeContent = [];
        } else {
          insideCodeBlock = true;
        }
        continue;
      }

      if (insideCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // Detectar Seção Principal (ex: ## 🚀 Features Próximas (A Fazer))
      if (line.startsWith('## ')) {
        currentMainSection = line.replace('## ', '').trim();
        // Limpar emojis ou tags se necessário, mas manter clean
        currentMainSection = currentMainSection.replace(/\[FEITO\]/gi, '').trim();
        currentTask = null;
        continue;
      }

      // Detectar Subcategoria (ex: ### Gestão Financeira & Inteligência de Negócio)
      if (line.startsWith('### ')) {
        currentSubcategory = line.replace('### ', '').trim();
        currentSubcategory = currentSubcategory.replace(/\[FEITO\]/gi, '').trim();
        currentTask = null;
        continue;
      }

      // Ignorar seções que são apenas textos explicativos, marketing ou resumos de priorização
      const sectionUpper = currentMainSection.toUpperCase();
      if (
        sectionUpper.includes('LANDIGPAGE') || 
        sectionUpper.includes('LANDINGPAGE') || 
        sectionUpper.includes('PRIORIZAÇÃO') ||
        sectionUpper.includes('PRIORIZACAO')
      ) {
        continue;
      }

      // Ignorar separadores horizontais e textos introdutórios
      if (trimmed.startsWith('---') || trimmed.startsWith('Este arquivo é destinado')) continue;

      // Identificar se a linha possui indentação de sub-item (começa com espaços ou tabs)
      const hasLeadingWhitespace = line.startsWith(' ') || line.startsWith('\t');

      // Uma tarefa principal (Feature) deve começar no início da linha (coluna 0) e ter um marcador
      const isTaskLine = !hasLeadingWhitespace && (
        trimmed.startsWith('- ') || 
        trimmed.startsWith('* ') || 
        /^\d+\.\s+/.test(trimmed)
      );

      if (isTaskLine) {
        // Tratar tarefas concluídas
        const isChecked = trimmed.includes('[x]') || trimmed.includes('[X]') || trimmed.includes('[FEITO]');
        
        // Limpar marcadores de markdown para o título
        let taskText = trimmed
          .replace(/^-\s+\[[x\s]\]\s+/i, '') // remove "- [ ]" ou "- [x]"
          .replace(/^-\s+/, '') // remove "- " simples
          .replace(/^\d+\.\s+\[[x\s]\]\s+/i, '') // remove "1. [ ]" ou "1. [x]"
          .replace(/^\d+\.\s+/, '') // remove "1. " simples
          .replace(/\[FEITO\]/gi, '') // remove tag [FEITO] redundante
          .replace(/\*\*/g, '') // remove negritos
          .trim();

        // Determinar prioridade/tipo
        let priority: 'CRÍTICO' | 'ERRO' | 'UX' | 'NORMAL' = 'NORMAL';
        if (trimmed.toUpperCase().includes('CRÍTICO')) {
          priority = 'CRÍTICO';
        } else if (trimmed.toUpperCase().includes('ERRO')) {
          priority = 'ERRO';
        } else if (/^[A-G]\d+:/.test(taskText) || trimmed.toUpperCase().includes('UX') || trimmed.toUpperCase().includes('MELHORIA')) {
          priority = 'UX';
        }

        // Limpar badges de prioridade do texto de exibição
        taskText = taskText
          .replace(/\[CRÍTICO\]/gi, '')
          .replace(/\[ERRO\]/gi, '')
          .trim();

        currentTask = {
          id: `task-${idCounter++}`,
          text: taskText,
          completed: isChecked,
          priority,
          details: [],
          category: currentMainSection,
          subcategory: currentSubcategory
        };
        tasks.push(currentTask);
      } else if (currentTask && hasLeadingWhitespace) {
        // Sub-itens ou detalhes da tarefa atual (identação detectada)
        const detailText = trimmed
          .replace(/^[-*]\s+/, '') // remove leading "-" or "*" list markers if any
          .replace(/^\d+\.\s+/, '') // remove leading "1. " list markers if any
          .replace(/^\[[x\s]\]\s+/i, '') // remove checkboxes inside sub-tasks if any
          .replace(/\*\*/g, '') // remove bold markers
          .trim();
        if (detailText) {
          currentTask.details.push(detailText);
        }
      }
    }

    return tasks;
  }, []);

  // Extrair categorias exclusivas para o menu lateral/filtros
  const categories = useMemo(() => {
    const cats = new Set<string>();
    parsedData.forEach(t => cats.add(t.category));
    return ['ALL', ...Array.from(cats)];
  }, [parsedData]);

  // Filtragem Dinâmica
  const filteredTasks = useMemo(() => {
    return parsedData.filter(task => {
      // 1. Filtro por Busca (título ou detalhes)
      const matchesSearch = task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 2. Filtro por Categoria Principal
      const matchesCategory = selectedCategory === 'ALL' || task.category === selectedCategory;

      // 3. Filtro por Status
      const matchesStatus = selectedStatus === 'ALL' ||
                            (selectedStatus === 'COMPLETED' && task.completed) ||
                            (selectedStatus === 'PENDING' && !task.completed);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [parsedData, searchQuery, selectedCategory, selectedStatus]);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const total = parsedData.length;
    const completed = parsedData.filter(t => t.completed).length;
    const pending = total - completed;
    const critical = parsedData.filter(t => t.priority === 'CRÍTICO' && !t.completed).length;
    const errors = parsedData.filter(t => t.priority === 'ERRO' && !t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, critical, errors, percent };
  }, [parsedData]);

  // Estatísticas por Categoria para exibir na barra de filtros
  const categoryStats = useMemo(() => {
    const map: Record<string, SectionStats> = {};
    parsedData.forEach(t => {
      if (!map[t.category]) map[t.category] = { total: 0, completed: 0 };
      map[t.category].total++;
      if (t.completed) map[t.category].completed++;
    });
    return map;
  }, [parsedData]);

  // Agrupamento por Categoria e Subcategoria para renderização estruturada
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Record<string, Task[]>> = {};
    
    filteredTasks.forEach(task => {
      if (!groups[task.category]) groups[task.category] = {};
      if (!groups[task.category][task.subcategory]) groups[task.category][task.subcategory] = [];
      groups[task.category][task.subcategory].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Inicializar todas as seções principais como expandidas por padrão
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    categories.forEach(cat => {
      if (cat !== 'ALL') initial[cat] = true;
    });
    setExpandedSections(initial);
  }, [categories]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased pb-24">
      {/* 1. Header do Painel */}
      <header className="relative overflow-hidden bg-slate-950 border-b border-slate-800 py-12 px-6 lg:px-12">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500 via-indigo-500 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                Modo Parceiro Estratégico
              </span>
              <span className="bg-slate-800 text-slate-400 text-[8px] font-mono tracking-widest px-2.5 py-1 rounded-full border border-slate-700">
                🔒 NO-INDEX
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter italic text-white mt-3 flex items-center gap-3">
              🚀 Roadmap & Backlog <span className="text-red-500 not-italic">Botequista</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-wide">
              Acompanhamento de entregas, planejamento operacional e priorização conjunta
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-slate-800 backdrop-blur-md">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progresso Geral</p>
              <p className="text-xl font-black italic text-emerald-400 mt-0.5">{stats.percent}% Concluído</p>
            </div>
            <div className="w-16 h-16 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" className="text-slate-800" strokeWidth="6" stroke="currentColor" fill="transparent" />
                <circle cx="32" cy="32" r="26" className="text-emerald-500 transition-all duration-1000" strokeWidth="6" strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - stats.percent / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" />
              </svg>
              <span className="absolute text-[11px] font-black">{stats.percent}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Cards de Métricas */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Auditado</p>
          <p className="text-3xl font-black text-white italic mt-2">{stats.total} <span className="text-sm font-bold text-slate-500 not-italic">tarefas</span></p>
        </div>
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entregas Realizadas</p>
          <p className="text-3xl font-black text-emerald-400 italic mt-2">{stats.completed} <span className="text-sm font-bold text-slate-500 not-italic">FEITO</span></p>
        </div>
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fila de Desenvolvimento</p>
          <p className="text-3xl font-black text-indigo-400 italic mt-2">{stats.pending} <span className="text-sm font-bold text-slate-500 not-italic">restantes</span></p>
        </div>
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Incidentes / Bloqueios</p>
          <p className={`text-3xl font-black italic mt-2 ${stats.critical + stats.errors > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
            {stats.critical + stats.errors} <span className="text-sm font-bold text-slate-500 not-italic">alertas</span>
          </p>
        </div>
      </section>

      {/* 3. Filtros & Busca */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-8">
        <div className="bg-slate-950 p-6 rounded-[35px] border border-slate-800 flex flex-col gap-6 shadow-md">
          {/* Busca por Texto */}
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg text-slate-500">🔍</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por funcionalidade, bug ou melhoria..."
              className="w-full pl-14 pr-6 py-5 rounded-[20px] bg-slate-900 border border-slate-800 font-bold text-sm outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all text-white placeholder-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors font-bold">✕</button>
            )}
          </div>

          {/* Filtros de Categoria */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 border-b border-slate-900">
            {categories.map(cat => {
              const count = cat === 'ALL' ? stats.total : (categoryStats[cat]?.total || 0);
              const done = cat === 'ALL' ? stats.completed : (categoryStats[cat]?.completed || 0);
              const pct = count > 0 ? Math.round((done / count) * 100) : 0;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest shrink-0 transition-all border flex items-center gap-2 ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/15' : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'}`}
                >
                  <span>{cat === 'ALL' ? 'Todos os Setores' : cat}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[8px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-950 text-slate-500'}`}>
                    {done}/{count} ({pct}%)
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtros de Status */}
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'ALL', label: 'Todos os Status' },
              { id: 'PENDING', label: 'Pendentes / Planejados ⏳' },
              { id: 'COMPLETED', label: 'Concluídos & Entregues ✓' },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedStatus === st.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'bg-slate-900 text-slate-500 hover:text-slate-350'}`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Lista Principal de Tarefas */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 mt-8 space-y-8">
        {filteredTasks.length === 0 ? (
          <div className="py-24 text-center border-4 border-dashed border-slate-800 rounded-[40px] opacity-40">
            <span className="text-5xl">🦗</span>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-400 mt-4 italic">Nenhum item localizado</h3>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Ajuste os filtros de busca para navegar no roadmap.</p>
          </div>
        ) : (
          Object.keys(groupedTasks).map(mainSection => {
            const isExpanded = expandedSections[mainSection] !== false;
            const subGroups = groupedTasks[mainSection];
            const sectionTotal = parsedData.filter(t => t.category === mainSection).length;
            const sectionDone = parsedData.filter(t => t.category === mainSection && t.completed).length;

            return (
              <div key={mainSection} className="bg-slate-950 rounded-[40px] border border-slate-800 shadow-md overflow-hidden transition-all duration-300">
                {/* Header da Seção */}
                <div 
                  onClick={() => toggleSection(mainSection)}
                  className="p-6 md:p-8 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{mainSection.includes('🚀') ? '🚀' : mainSection.includes('🐛') ? '🐛' : mainSection.includes('🔧') ? '🔧' : '📂'}</span>
                    <div>
                      <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter italic text-white leading-none">{mainSection}</h2>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Setor de desenvolvimento</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black bg-slate-800 px-3 py-1.5 rounded-xl text-slate-400 uppercase tracking-widest font-mono">
                      {sectionDone} / {sectionTotal} concluídos
                    </span>
                    <span className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </div>

                {/* Subcategorias e Tarefas */}
                {isExpanded && (
                  <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-300">
                    {Object.keys(subGroups).map(subCategory => (
                      <div key={subCategory} className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-900 pb-2">
                          <span className="w-1.5 h-3 rounded-full bg-red-500"></span>
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">{subCategory}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {subGroups[subCategory].map(task => {
                            // Estilos dinâmicos premium baseados na prioridade e status do item
                            let cardStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700';
                            let leftBorder = 'border-l-4 border-l-slate-700';

                            if (task.completed) {
                              cardStyle = 'bg-slate-900/35 border-slate-850 opacity-65';
                              leftBorder = 'border-l-4 border-l-emerald-500';
                            } else {
                              switch (task.priority) {
                                case 'CRÍTICO':
                                  cardStyle = 'bg-slate-900 border-slate-800 hover:border-red-500/25 shadow-lg shadow-red-950/10';
                                  leftBorder = 'border-l-4 border-l-red-500';
                                  break;
                                case 'ERRO':
                                  cardStyle = 'bg-slate-900 border-slate-800 hover:border-amber-500/25 shadow-lg shadow-amber-950/10';
                                  leftBorder = 'border-l-4 border-l-amber-500';
                                  break;
                                case 'UX':
                                  cardStyle = 'bg-slate-900 border-slate-800 hover:border-blue-500/25';
                                  leftBorder = 'border-l-4 border-l-blue-500';
                                  break;
                              }
                            }

                            return (
                              <div 
                                key={task.id}
                                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-start gap-4 ${cardStyle} ${leftBorder}`}
                              >
                                {/* Checkbox Decorativo */}
                                <div className="flex shrink-0 items-start mt-0.5">
                                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border ${task.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                                    {task.completed ? '✓' : ''}
                                  </span>
                                </div>

                                {/* Conteúdo Principal */}
                                <div className="flex-1 min-w-0 space-y-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                      {/* Priority Badges */}
                                      {task.priority === 'CRÍTICO' && (
                                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">CRÍTICO</span>
                                      )}
                                      {task.priority === 'ERRO' && (
                                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">INCIDENTE</span>
                                      )}
                                      {task.priority === 'UX' && (
                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">UX / REFINAMENTO</span>
                                      )}
                                      {task.completed && (
                                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded">✓ CONCLUÍDO</span>
                                      )}
                                    </div>
                                    
                                    <p className={`text-sm font-semibold tracking-tight ${task.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                      {task.text}
                                    </p>
                                  </div>

                                  {/* Detalhes / Subitens (Complementos) */}
                                  {task.details.length > 0 && (
                                    <div className="mt-3 bg-slate-950/45 p-4 rounded-xl border border-slate-850/60 space-y-2">
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none mb-1">
                                        <span>⚙️</span> Complementos & Detalhes
                                      </p>
                                      <ul className="space-y-1.5 pl-1">
                                        {task.details.map((detail, dIdx) => (
                                          <li key={dIdx} className="text-[11px] font-medium text-slate-400 flex items-start gap-2.5 leading-relaxed">
                                            <span className="text-red-500/60 mt-1.5 text-[6px] shrink-0">▪</span>
                                            <span>{detail}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Bloco de Código Técnico */}
                                  {task.codeBlock && (
                                    <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden mt-3 relative group/terminal shadow-inner">
                                      <div className="bg-slate-900 px-4 py-2 flex justify-between items-center border-b border-slate-850">
                                        <span className="text-[8px] font-mono text-slate-500 tracking-widest uppercase">Visualizador Técnico / Código de Referência</span>
                                        <button 
                                          onClick={() => handleCopyCode(task.id, task.codeBlock || '')}
                                          className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                                        >
                                          {copiedCodeId === task.id ? 'Copiado! ✓' : 'Copiar'}
                                        </button>
                                      </div>
                                      <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre no-scrollbar leading-relaxed">
                                        <code>{task.codeBlock}</code>
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Footer Fixo de Ação */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 py-4 px-6 text-center z-50">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
          Botequista Core v4.9.5 • Relatório em Tempo Real Gerado Automaticamente do Repositório do Sistema
        </p>
      </footer>
    </div>
  );
};

export default TodoViewer;
