
import React from 'react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Theme } from '../../../types';

interface OperationalReportProps {
  reportData: any;
  theme?: Theme;
}

const OperationalReport: React.FC<OperationalReportProps> = ({ reportData, theme }) => {
  const peakHour = reportData.hourlyMap.reduce((prev: any, current: any) => (prev.count > current.count) ? prev : current);
  const isDark = theme === 'dark';

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-8 italic">Fluxo de Pedidos por Hora</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.hourlyMap}>
                <defs>
                  <linearGradient id="colorOpV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9, fontWeight: '900' }} interval={2} />
                <YAxis hide />
                <Tooltip cursor={{ stroke: '#ef4444', strokeWidth: 2 }} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorOpV)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center text-center">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 italic">Média de Pedidos / Comanda</p>
           <p className="text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white">{(reportData.operationalCount / (reportData.activeDataSource.length || 1)).toFixed(1)}</p>
           <p className="text-[9px] font-black uppercase text-emerald-500 mt-4 tracking-widest">Eficiência Operacional</p>
        </div>
      </div>
    </div>
  );
};

export default OperationalReport;
