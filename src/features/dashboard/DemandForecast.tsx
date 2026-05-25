import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Product, formatCurrency } from '../../types';

interface DemandForecastProps {
  sales: Sale[];
  products: Product[];
}

type WeatherMode = 'auto' | 'sunny' | 'cloudy' | 'rainy' | 'cold';

export const DemandForecast: React.FC<DemandForecastProps> = ({ sales = [], products = [] }) => {
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('auto');
  const [weatherTemp, setWeatherTemp] = useState<number>(23);
  const [weatherCondition, setWeatherCondition] = useState<string>('Agradável');
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 1. Motor de Cálculo: Agrupamento de Vendas por Data
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    (sales || []).forEach(s => {
      if (s.deleted) return;
      // Normaliza para a data local do bar
      const date = new Date(s.timestamp);
      const dayStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      totals[dayStr] = (totals[dayStr] || 0) + (s.total || 0);
    });
    return totals;
  }, [sales]);

  // 2. Faturamento Diário Médio Geral
  const overallDailyAvg = useMemo(() => {
    const values = Object.values(dailyTotals);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }, [dailyTotals]);

  // 3. Estatísticas Específicas do Dia da Semana Atual
  const todayDayOfWeek = useMemo(() => new Date().getDay(), []); // 0 = Domingo, 6 = Sábado
  const dayOfWeekNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const currentDayName = dayOfWeekNames[todayDayOfWeek];

  const dayOfWeekStats = useMemo(() => {
    const daySalesValues: number[] = [];
    Object.entries(dailyTotals).forEach(([dayStr, total]) => {
      // Reconstrói a data com segurança
      const parts = dayStr.split('-');
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (date.getDay() === todayDayOfWeek) {
        daySalesValues.push(total);
      }
    });

    if (daySalesValues.length === 0) return { avg: 0, count: 0 };
    const sum = daySalesValues.reduce((acc, v) => acc + v, 0);
    return { avg: sum / daySalesValues.length, count: daySalesValues.length };
  }, [dailyTotals, todayDayOfWeek]);

  // 4. Produtos Mais Vendidos Neste Dia da Semana no Histórico
  const topProductsForDayOfWeek = useMemo(() => {
    const itemCounts: Record<string, { qty: number; count: number }> = {};
    let dayOccurrences = 0;
    const recordedDates = new Set<string>();

    (sales || []).forEach(s => {
      if (s.deleted) return;
      const date = new Date(s.timestamp);
      const dayStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (date.getDay() === todayDayOfWeek) {
        recordedDates.add(dayStr);
        if (s.items) {
          s.items.forEach(item => {
            if (item.productId === 'quitacao' || item.productId === '_debt_settlement') return;
            if (!itemCounts[item.productId]) {
              itemCounts[item.productId] = { qty: 0, count: 0 };
            }
            itemCounts[item.productId].qty += item.quantity;
          });
        }
      }
    });

    dayOccurrences = recordedDates.size || 1;

    return Object.entries(itemCounts)
      .map(([id, stats]) => {
        const prod = products.find(p => p.id === id);
        return {
          id,
          name: prod?.name || 'Produto',
          avgQty: stats.qty / dayOccurrences,
          sellType: prod?.sellType || 'un'
        };
      })
      .sort((a, b) => b.avgQty - a.avgQty)
      .slice(0, 3);
  }, [sales, products, todayDayOfWeek]);

  // 5. Chamada de Clima em Tempo Real (Open-Meteo API pública)
  useEffect(() => {
    if (weatherMode !== 'auto') return;

    const fetchWeather = async (lat: number, lon: number) => {
      setIsFetchingWeather(true);
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            setWeatherTemp(temp);
            
            // Mapeia códigos de clima do Open-Meteo (WMO Weather interpretation codes)
            const code = data.current_weather.weathercode;
            let condition = 'Agradável';
            if (code === 0) condition = 'Céu Limpo ☀️';
            else if (code >= 1 && code <= 3) condition = 'Parcialmente Nublado ☁️';
            else if (code >= 51 && code <= 67) condition = 'Chuva Leve 🌧️';
            else if (code >= 71 && code <= 82) condition = 'Garôa/Neve ❄️';
            else if (code >= 85 && code <= 99) condition = 'Temporal/Chuva Forte ⛈️';
            
            setWeatherCondition(condition);
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar API Open-Meteo', err);
        // Fallback silencioso elegante
        setWeatherTemp(24);
        setWeatherCondition('Agradável (Offline) 🍃');
      } finally {
        setIsFetchingWeather(false);
      }
    };

    // Tenta usar a geolocalização do navegador
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback para coordenadas aproximadas de São Paulo
          fetchWeather(-23.5489, -46.6388);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(-23.5489, -46.6388);
    }
  }, [weatherMode]);

  // Atualiza descrições e temperatura ao forçar clima manual
  useEffect(() => {
    if (weatherMode === 'sunny') {
      setWeatherTemp(31);
      setWeatherCondition('Calor de Lascar ☀️');
    } else if (weatherMode === 'cloudy') {
      setWeatherTemp(22);
      setWeatherCondition('Nublado Agradável ☁️');
    } else if (weatherMode === 'rainy') {
      setWeatherTemp(19);
      setWeatherCondition('Chovendo 🌧️');
    } else if (weatherMode === 'cold') {
      setWeatherTemp(14);
      setWeatherCondition('Frio Congelante ❄️');
    }
  }, [weatherMode]);

  // 6. Cruzamento de Dados e Cálculo da Previsão Final
  const forecast = useMemo(() => {
    let baselineRatio = 1.0;
    
    if (overallDailyAvg > 0 && dayOfWeekStats.avg > 0) {
      baselineRatio = dayOfWeekStats.avg / overallDailyAvg;
    } else {
      // Se não há dados históricos na conta, fazemos uma estimativa sensata por dia de semana
      const isWeekend = todayDayOfWeek === 0 || todayDayOfWeek === 5 || todayDayOfWeek === 6;
      baselineRatio = isWeekend ? 1.3 : 0.85;
    }

    // Fator Clima
    let climateMultiplier = 1.0;
    if (weatherMode === 'sunny') {
      climateMultiplier = 1.25; // Solzão atrai público para bar
    } else if (weatherMode === 'rainy') {
      climateMultiplier = 0.65; // Chuva afasta público
    } else if (weatherMode === 'cold') {
      climateMultiplier = 0.8;  // Frio reduz consumo de gelados
    } else if (weatherMode === 'cloudy') {
      climateMultiplier = 1.0;  // Neutro
    } else {
      // Modo Auto: avalia a temperatura real carregada
      if (weatherTemp > 28) {
        climateMultiplier = 1.2;
      } else if (weatherTemp < 17) {
        climateMultiplier = 0.75;
      }
      if (
        weatherCondition.includes('🌧️') || 
        weatherCondition.includes('⛈️') || 
        weatherCondition.toLowerCase().includes('chuva')
      ) {
        climateMultiplier *= 0.85;
      }
    }

    const finalScore = baselineRatio * climateMultiplier;

    let level: 'ALTO' | 'MÉDIO' | 'BAIXO' = 'MÉDIO';
    let badgeColor = 'bg-amber-500 text-white';
    let textColor = 'text-amber-500';
    let progressPercent = 50;
    let description = '';

    if (finalScore >= 1.15) {
      level = 'ALTO';
      badgeColor = 'bg-emerald-600 dark:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20';
      textColor = 'text-emerald-500';
      progressPercent = 85;
      description = `Forte expectativa de casa cheia hoje! O histórico de ${currentDayName} associado ao clima de ${weatherTemp}°C cria o cenário ideal para recorde de vendas. Prepare a casa.`;
    } else if (finalScore < 0.85) {
      level = 'BAIXO';
      badgeColor = 'bg-slate-500 dark:bg-slate-700 text-white';
      textColor = 'text-slate-500 dark:text-slate-400';
      progressPercent = 25;
      description = `Ritmo esperado mais calmo. Uma ótima oportunidade para realizar contagens físicas detalhadas de estoque, organizar adegas e focar no atendimento consultivo individual.`;
    } else {
      level = 'MÉDIO';
      badgeColor = 'bg-amber-500 dark:bg-amber-600 text-white shadow-lg shadow-amber-500/20';
      textColor = 'text-amber-500';
      progressPercent = 55;
      description = `Fluxo regular de clientes previsto. Dia equilibrado e sob controle. Mantenha os padrões usuais de operação e reposição do salão.`;
    }

    // 7. Geração das tarefas de preparação baseadas nas estatísticas
    const checklist: { id: string; text: string; category: string }[] = [];

    // Tarefas baseadas nos produtos mais vendidos
    topProductsForDayOfWeek.forEach((item, idx) => {
      const multiplier = level === 'ALTO' ? 1.3 : level === 'BAIXO' ? 0.75 : 1.0;
      const recommendedQty = Math.max(1, Math.ceil((item.avgQty || 8) * multiplier));
      checklist.push({
        id: `prod-${item.id}`,
        text: `Geladeira de ${item.name}: Abastecer e gelar pelo menos ${recommendedQty} ${item.sellType}.`,
        category: 'Estoque & Bebidas'
      });
    });

    // Tarefas fixas baseadas no volume e clima
    if (level === 'ALTO') {
      checklist.push({
        id: 'team-high',
        text: 'Escala de Equipe: Garantir equipe completa de atendimento e caixa para evitar filas.',
        category: 'Equipe'
      });
      checklist.push({
        id: 'ice-high',
        text: 'Reserva de Gelo: Confirmar se há no mínimo 4 sacos de gelo prontos para uso.',
        category: 'Estoque & Bebidas'
      });
    } else if (level === 'BAIXO') {
      checklist.push({
        id: 'promo-low',
        text: 'Fidelização: Estimular consumo sugerindo o Happy Hour ou combos aos clientes que chegarem.',
        category: 'Vendas'
      });
      checklist.push({
        id: 'clean-low',
        text: 'Manutenção: Dedicar a última hora do turno para limpeza profunda de bicos de chopeiras.',
        category: 'Manutenção'
      });
    } else {
      checklist.push({
        id: 'team-med',
        text: 'Escala Padrão: Equipe padrão é o suficiente para cobrir os pedidos sem correria.',
        category: 'Equipe'
      });
    }

    if (weatherMode === 'sunny' || (weatherMode === 'auto' && weatherTemp > 26)) {
      checklist.push({
        id: 'weather-hot',
        text: 'Clima Quente: Garantir que copos de chopp estejam no congelador para servir bem gelado.',
        category: 'Serviço'
      });
    } else if (weatherMode === 'rainy') {
      checklist.push({
        id: 'weather-rain',
        text: 'Clima Chuvoso: Verificar toldos externos e disponibilizar porta-guarda-chuvas na entrada.',
        category: 'Serviço'
      });
    } else if (weatherMode === 'cold' || (weatherMode === 'auto' && weatherTemp < 18)) {
      checklist.push({
        id: 'weather-cold',
        text: 'Clima Frio: Instigar garçons a oferecer opções quentes, caldos ou drinks com destilados.',
        category: 'Serviço'
      });
    }

    return {
      level,
      score: finalScore,
      badgeColor,
      textColor,
      progressPercent,
      description,
      checklist
    };
  }, [overallDailyAvg, dayOfWeekStats.avg, todayDayOfWeek, weatherMode, weatherTemp, weatherCondition, topProductsForDayOfWeek, currentDayName]);

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="p-8 border shadow-sm bg-white dark:bg-slate-900 rounded-[40px] border-slate-200 dark:border-slate-800 xl:col-span-2 flex flex-col justify-between">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">🔮 Previsão de Movimento</h3>
            <h4 className="text-sm font-black uppercase italic tracking-tight text-slate-800 dark:text-white leading-none">Motor Stand-alone Botequista</h4>
          </div>
          
          <div className="flex items-center p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 self-start md:self-center">
            {(['auto', 'sunny', 'cloudy', 'rainy', 'cold'] as const).map(mode => {
              const label = mode === 'auto' ? 'AUTO 📡' : mode === 'sunny' ? '☀️' : mode === 'cloudy' ? '☁️' : mode === 'rainy' ? '🌧️' : '❄️';
              return (
                <button
                  key={mode}
                  onClick={() => setWeatherMode(mode)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                    weatherMode === mode 
                      ? 'bg-red-600 text-white shadow shadow-red-500/10 scale-105 z-10' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title={mode === 'auto' ? 'Sincronizar clima em tempo real' : `Simular clima ${mode}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 dark:bg-slate-950/40 p-6 rounded-[30px] border border-slate-100 dark:border-slate-800 mb-6">
          <div className="md:col-span-4 text-center md:border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 space-y-3">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Hoje é {currentDayName}</span>
            <div className="flex justify-center items-center gap-1.5">
              <span className="text-3xl">{weatherMode === 'sunny' ? '☀️' : weatherMode === 'rainy' ? '🌧️' : weatherMode === 'cold' ? '❄️' : weatherMode === 'cloudy' ? '☁️' : '🍃'}</span>
              <span className="text-3xl font-black italic tracking-tighter text-slate-800 dark:text-white">{weatherTemp}°C</span>
            </div>
            <span className="text-[9px] font-black bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full uppercase leading-none block w-fit mx-auto">
              {weatherCondition}
            </span>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Fluxo Esperado:</span>
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${forecast.badgeColor}`}>
                {forecast.level}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${forecast.progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-slate-600 dark:text-slate-400">
              {forecast.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-2">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-2">
          <span>📋 Checklist Prático de Preparação</span>
          <span className="bg-red-500/10 text-red-500 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Sugerido para hoje</span>
        </h4>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {forecast.checklist.map((item, idx) => (
            <div 
              key={item.id} 
              onClick={() => toggleCheck(item.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group 
                ${checkedItems[item.id] 
                  ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-50' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-red-500/20'}`}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors
                  ${checkedItems[item.id] 
                    ? 'bg-red-600 border-red-600 text-white' 
                    : 'border-slate-200 dark:border-slate-700 group-hover:border-red-400'}`}
                >
                  {checkedItems[item.id] && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <p className={`text-xs leading-tight font-black uppercase text-slate-700 dark:text-slate-200 truncate ${checkedItems[item.id] ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                  {item.text}
                </p>
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg shrink-0 select-none ml-2
                ${checkedItems[item.id] 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500'}`}
              >
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DemandForecast;
