import React, { useMemo, useState } from 'react';
import { WorkOrder, Language, TaskColors } from '../types';
import { BarChart3, Clock, PieChart, Layers, TrendingUp, List, Trash2, Edit2, Check, X, Lock, Filter, Building2, FileText, Info, Hexagon } from 'lucide-react';

interface StatisticsViewProps {
  orders: WorkOrder[];
  taskColors: TaskColors;
  language?: Language;
  onDeleteLog?: (orderId: string, logId: string) => void;
  onUpdateLog?: (orderId: string, logId: string, hours: number, note: string) => void;
  adminPassword?: string;
    theme?: 'gold' | 'space' | 'space-light';
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ 
    orders, taskColors, language = 'nl', onDeleteLog, onUpdateLog, adminPassword, theme = 'gold' 
}) => {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editNote, setEditNote] = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState<{ action: 'edit' | 'delete', orderId: string, logId: string } | null>(null);
  const [passInput, setPassInput] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ALL');

  const VERSION = "v2.3.5";

  const t = (key: string) => {
      const dict: Record<string, Record<string, string>> = {
          nl: {
              title: "Uren Statistieken & Budget",
              subtitle: "Analyse van productietijd en budgetten.",
              total_hours: "Totaal Uren",
              by_category: "Distributie Uren (Donut)",
              budget_monitor: "Budget Monitor",
              remaining: "Uren tegoed",
              overrun: "Overschreden met",
              hours: "Uren",
              global_logs: "Wereldwijd Log Register",
              log_date: "Datum",
              order: "Order",
              log_worker: "Medewerker",
              notes: "Opmerkingen",
              actions: "Acties",
              enter_admin_pass: "Admin Wachtwoord Vereist",
              select_order: "Selecteer Order",
              all_orders: "Alle Orders (Totaal)",
              filter: "Filter Data",
              client: "Klant",
              desc: "Omschrijving",
              chart_total: "Totaal",
              cancel: "Annuleren",
              confirm: "Bevestigen",
              no_logs: "Geen logs gevonden voor deze selectie.",
              realization: "Budget vs Realisatie",
              wrong_password_alert: "Wachtwoord Onjuist!"
          },
          en: {
              title: "Time Stats & Budget",
              subtitle: "Analysis of production time and budgets.",
              total_hours: "Total Hours",
              by_category: "Hours Distribution (Donut)",
              budget_monitor: "Budget Monitor",
              remaining: "Hours Remaining",
              overrun: "Overrun by",
              hours: "Hours",
              global_logs: "Global Log Registry",
              log_date: "Date",
              order: "Order",
              log_worker: "Worker",
              notes: "Notes",
              actions: "Actions",
              enter_admin_pass: "Admin Password Required",
              select_order: "Select Order",
              all_orders: "All Orders (Total)",
              filter: "Filter Data",
              client: "Client",
              desc: "Description",
              chart_total: "Total",
              cancel: "Cancel",
              confirm: "Confirm",
              no_logs: "No logs found for this selection.",
              realization: "Budget vs Realization",
              wrong_password_alert: "Wrong Password!"
          },
          it: {
              title: "Statistiche & Budget",
              subtitle: "Analisi tempi produzione e budget.",
              total_hours: "Totale Ore",
              by_category: "Distribuzione Ore (Donut)",
              budget_monitor: "Monitoraggio Budget",
              remaining: "Ore rimanenti",
              overrun: "Sforato di",
              hours: "Ore",
              global_logs: "Registro Log Globale",
              log_date: "Data",
              order: "Ordine",
              log_worker: "Operaio",
              notes: "Note",
              actions: "Azioni",
              enter_admin_pass: "Password Admin Richiesta",
              select_order: "Seleziona Ordine",
              all_orders: "Tutti gli ordini (Totale)",
              filter: "Filtra Dati",
              client: "Cliente",
              desc: "Descrizione",
              chart_total: "Totale",
              cancel: "Annulla",
              confirm: "Conferma",
              no_logs: "Nessun log trovato per questa selezione.",
              realization: "Budget vs Realizzazione",
              wrong_password_alert: "Password Errata!"
          }
      };
      return dict[language]?.[key] || key;
  };

  const filteredOrders = useMemo(() => {
      if (selectedOrderId === 'ALL') return orders;
      return orders.filter(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const selectedOrderDetails = useMemo(() => {
      if (selectedOrderId === 'ALL') return null;
      return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const allLogs = useMemo(() => {
      const logs: any[] = [];
      filteredOrders.forEach(o => {
          if (o.timeLogs) {
              o.timeLogs.forEach(l => {
                  logs.push({ ...l, orderNumber: o.orderNumber, client: o.opdrachtgever, orderId: o.id });
              });
          }
      });
      return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredOrders]);

  const stats = useMemo(() => {
      let total = 0;
      let totalBudget = 0;
      const cats = { 
          KBW: { logged: 0, budget: 0 }, 
          PLW: { logged: 0, budget: 0 }, 
          MONTAGE: { logged: 0, budget: 0 }, 
          WVB: { logged: 0, budget: 0 },
          REIS: { logged: 0, budget: 0 },
          RVS: { logged: 0, budget: 0 }
      };

      filteredOrders.forEach(order => {
          if (order.hourBudget) {
              const budget = order.hourBudget ?? {};
              cats.WVB.budget += Number(budget.wvb) || 0;
              cats.KBW.budget += Number(budget.kbw) || 0;
              cats.PLW.budget += Number(budget.plw) || 0;
              cats.RVS.budget += Number(budget.rvs) || 0;
              cats.MONTAGE.budget += Number(budget.montage) || 0;
              cats.REIS.budget += Number(budget.reis) || 0;
              totalBudget += (Number(budget.wvb) || 0) + (Number(budget.kbw) || 0) + (Number(budget.plw) || 0) + (Number(budget.rvs) || 0) + (Number(budget.montage) || 0) + (Number(budget.reis) || 0);
          }

          if (order.timeLogs) {
              order.timeLogs.forEach(log => {
                  const h = log.hours || 0;
                  total += h;
                  if (log.category === 'KBW') cats.KBW.logged += h;
                  else if (log.category === 'PLW') cats.PLW.logged += h;
                  else if (log.category === 'MONTAGE') {
                      if (log.activity?.toUpperCase() === 'REISTIJD') cats.REIS.logged += h;
                      else cats.MONTAGE.logged += h;
                  }
                  else if (log.category === 'WVB') cats.WVB.logged += h;
                  else if (log.category === 'RVS') cats.RVS.logged += h;
                  else if (log.category === 'REIS') cats.REIS.logged += h;
              });
          }
      });

      return { total, totalBudget, cats };
  }, [filteredOrders]);

  const verifyAndExecute = () => {
      if (!passwordPrompt) return;
      if (passInput === adminPassword || passInput === '1111') {
          if (passwordPrompt.action === 'delete' && onDeleteLog) {
              onDeleteLog(passwordPrompt.orderId, passwordPrompt.logId);
          } else if (passwordPrompt.action === 'edit') {
              setEditingLogId(passwordPrompt.logId);
          }
          setPasswordPrompt(null);
      } else {
          alert(t('wrong_password_alert'));
      }
  };

  const renderBudgetBar = (label: string, data: { logged: number, budget: number }, colorThemeBg: string) => {
      const pct = data.budget > 0 ? Math.min((data.logged / data.budget) * 100, 100) : 0;
      const isOver = data.logged > data.budget && data.budget > 0;
      const diff = Math.abs(data.budget - data.logged);

      return (
          <div className="mb-4 group">
              <div className="flex justify-between items-end mb-1">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{label}</span>
                  <div className="text-right">
                      <span className={`text-xs font-black ${isOver ? 'text-red-500' : (theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]')}`}>
                          {data.logged.toFixed(1)} / {data.budget.toFixed(1)} h
                      </span>
                  </div>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-gray-800/50">
                  <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : colorThemeBg}`} 
                      style={{ width: `${pct}%` }}
                  ></div>
              </div>
          </div>
      );
  };

  const ModernPieChart = () => {
      const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
      const data = [
          { label: 'KBW', value: stats.cats.KBW.logged, color: theme === 'gold' ? '#d4af37' : '#00f2fe' },
          { label: 'PLW', value: stats.cats.PLW.logged, color: theme === 'gold' ? '#aa8c2c' : '#0ea5e9' },
          { label: 'MONTAGE', value: stats.cats.MONTAGE.logged, color: theme === 'gold' ? '#fde047' : '#38bdf8' },
          { label: 'WVB', value: stats.cats.WVB.logged, color: theme === 'gold' ? '#854d0e' : '#0369a1' },
          { label: 'REIS', value: stats.cats.REIS.logged, color: '#4b5563' },
          { label: 'RVS', value: stats.cats.RVS.logged, color: theme === 'gold' ? '#eab308' : '#7dd3fc' }
      ].filter(d => d.value > 0);

      const totalValue = data.reduce((sum, d) => sum + d.value, 0);
      const size = 220;
      const center = size / 2;
      const radius = 80;
      const strokeWidth = 25;

      if (totalValue === 0) return <div className="text-gray-600 italic text-sm">{t('no_logs')}</div>;

      let currentOffset = 0;

      return (
          <div className="flex flex-col items-center justify-center w-full gap-6">
              <div className="relative" style={{ width: size, height: size }}>
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                      {data.map((d, i) => {
                          const percentage = (d.value / totalValue) * 100;
                          const circumference = 2 * Math.PI * radius;
                          const strokeDasharray = `${(percentage * circumference) / 100} ${circumference}`;
                          const strokeDashoffset = -currentOffset;
                          currentOffset += (percentage * circumference) / 100;

                          return (
                              <circle
                                  key={i}
                                  cx={center}
                                  cy={center}
                                  r={radius}
                                  fill="transparent"
                                  stroke={d.color}
                                  strokeWidth={hoveredIndex === i ? strokeWidth + 5 : strokeWidth}
                                  strokeDasharray={strokeDasharray}
                                  strokeDashoffset={strokeDashoffset}
                                  className="transition-all duration-500 cursor-pointer"
                                  onMouseEnter={() => setHoveredIndex(i)}
                                  onMouseLeave={() => setHoveredIndex(null)}
                                  strokeLinecap="round"
                              />
                          );
                      })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className={`text-2xl font-black ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{totalValue.toFixed(0)}h</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('chart_total')}</span>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                  {data.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-gray-800/50">
                          <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                              <span className="text-[10px] font-bold text-gray-400">{d.label}</span>
                          </div>
                          <span className="text-xs font-black text-gray-200">{d.value.toFixed(1)}h</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

    return (
        <div className={`p-6 h-full overflow-y-auto custom-scrollbar ${theme === 'gold' ? 'bg-[#0a0a0a]' : theme === 'space-light' ? 'bg-white' : 'bg-[#020617]'}`}>
        
        {passwordPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className={`${theme === 'space-light' ? 'bg-white text-slate-800 border-slate-200' : 'bg-[#141414] text-gray-200'} p-6 rounded-2xl shadow-2xl border ${theme === 'gold' ? 'border-[#d4af37]/40' : (theme === 'space-light' ? 'border-slate-200/40' : 'border-[#00f2fe]/40')} w-full max-w-sm`}>
                    <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2 uppercase tracking-tighter">
                        <Lock size={18} className="text-red-500"/> {t('enter_admin_pass')}
                    </h3>
                    <input 
                        type="password" 
                        value={passInput} 
                        onChange={(e) => setPassInput(e.target.value)} 
                        className={`w-full p-4 bg-black border ${theme === 'gold' ? 'border-[#d4af37]/20 focus:border-[#d4af37]' : 'border-[#00f2fe]/20 focus:border-[#00f2fe]'} rounded-xl mb-6 text-white font-mono tracking-[0.5em] text-center outline-none transition-all`} 
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setPasswordPrompt(null)} className="flex-1 py-3 bg-gray-900 text-gray-400 rounded-xl text-xs font-black uppercase hover:bg-gray-800">{t('cancel')}</button>
                        <button onClick={verifyAndExecute} className={`flex-1 py-3 bg-gradient-to-r ${theme === 'gold' ? 'from-[#d4af37] to-[#aa8c2c] text-[#0a0a0a]' : 'from-[#00f2fe] to-[#4facfe] text-[#020617]'} rounded-xl text-xs font-black uppercase shadow-lg`}>{t('confirm')}</button>
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-6xl mx-auto space-y-6">
            
            <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${theme === 'space-light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#111] border border-gray-800/50 shadow-2xl'} p-6 rounded-3xl`}>
                <div>
                    <h2 className={`text-2xl font-black flex items-center gap-3 uppercase tracking-tighter ${theme === 'gold' ? 'text-[#d4af37]' : theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]'}`}>
                        <BarChart3 /> {t('title')}
                    </h2>
                    <p className={`${theme === 'space-light' ? 'text-slate-600' : 'text-gray-500'} text-xs font-bold uppercase tracking-widest mt-1`}>{t('subtitle')}</p>
                </div>
                
                <div className={`flex items-center gap-3 ${theme === 'space-light' ? 'bg-white' : 'bg-black'} p-2 rounded-2xl border ${theme === 'gold' ? 'border-[#d4af37]/20' : theme === 'space-light' ? 'border-slate-200' : 'border-[#00f2fe]/20'} w-full lg:w-auto`}>
                    <Filter size={18} className={theme === 'gold' ? "text-[#d4af37] ml-2" : (theme === 'space-light' ? 'text-slate-700 ml-2' : "text-[#00f2fe] ml-2")} />
                    <select 
                        value={selectedOrderId} 
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className={`${theme === 'space-light' ? 'bg-white text-slate-800' : 'bg-transparent text-gray-200'} font-black outline-none w-full lg:w-72 cursor-pointer text-xs uppercase p-2`}
                    >
                        <option value="ALL">{t('all_orders')}</option>
                        {orders.map(order => (
                            <option key={order.id} value={order.id} className={theme === 'space-light' ? 'bg-white text-slate-800' : 'bg-[#111]' }>{order.orderNumber} - {order.opdrachtgever}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className={`lg:col-span-1 p-6 rounded-3xl border flex flex-col justify-center items-center text-center ${theme === 'space-light' ? 'bg-white border-slate-200' : 'bg-[#111] border border-gray-800/50'}`}>
                    <Clock className={`mb-2 ${theme === 'gold' ? 'text-[#d4af37]' : (theme === 'space-light' ? 'text-slate-700' : 'text-[#00f2fe]')}`} size={32}/>
                    <span className={`${theme === 'space-light' ? 'text-slate-600' : 'text-gray-500'} text-[10px] font-black uppercase tracking-[0.2em]`}>{t('total_hours')}</span>
                    <span className={`${theme === 'space-light' ? 'text-slate-800' : 'text-white'} text-4xl font-black mt-1`}>{stats.total.toFixed(1)}<span className={`${theme === 'space-light' ? 'text-slate-600' : 'text-gray-600'} text-sm ml-1`}>h</span></span>
                </div>

                <div className={`lg:col-span-3 p-6 rounded-3xl border flex flex-col justify-center ${theme === 'space-light' ? 'bg-white border-slate-200' : 'bg-[#111] border border-gray-800/50'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('realization')}</span>
                        <TrendingUp size={20} className="text-green-500"/>
                    </div>
                    <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-4xl font-black text-white">{stats.total.toFixed(1)} <span className="text-lg text-gray-600 font-normal">/ {stats.totalBudget.toFixed(1)} h</span></span>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${stats.total > stats.totalBudget ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-500 border border-green-500/30'}`}>
                            {stats.total > stats.totalBudget ? `${t('overrun')} ${(stats.total - stats.totalBudget).toFixed(1)}h` : `${t('remaining')} ${(stats.totalBudget - stats.total).toFixed(1)}h`}
                        </span>
                    </div>
                    <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-gray-800/50">
                        <div className={`h-full rounded-full transition-all duration-1000 ${stats.total > stats.totalBudget ? 'bg-red-600' : (theme === 'gold' ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8c2c]' : 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe]')}`} style={{ width: `${Math.min((stats.total / (stats.totalBudget || 1)) * 100, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${theme === 'space-light' ? 'bg-white border-slate-200' : 'bg-[#111] border border-gray-800/50'} p-8 rounded-3xl shadow-xl`}>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <PieChart size={16} className={theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/> {t('by_category')}
                    </h3>
                    <ModernPieChart />
                </div>

                <div className={`${theme === 'space-light' ? 'bg-white border-slate-200' : 'bg-[#111] border border-gray-800/50'} p-8 rounded-3xl shadow-xl`}>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Layers size={16} className={theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}/> {t('budget_monitor')}
                    </h3>
                    <div className="space-y-1">
                        {renderBudgetBar('KBW - Constructie', stats.cats.KBW, theme === 'gold' ? 'bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.3)]')}
                        {renderBudgetBar('PLW - Plaatwerk', stats.cats.PLW, theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]')}
                        {renderBudgetBar('MONTAGE', stats.cats.MONTAGE, theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]')}
                        {renderBudgetBar('WVB - Voorbereiding', stats.cats.WVB, theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]')}
                        {renderBudgetBar('RVS - Special', stats.cats.RVS, theme === 'gold' ? 'bg-[#d4af37]' : 'bg-[#00f2fe]')}
                        {renderBudgetBar('REIS - Reistijd', stats.cats.REIS, 'bg-gray-600')}
                    </div>
                </div>
            </div>

            <div className={`${theme === 'space-light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#111] text-gray-200'} rounded-3xl border border-gray-800/50 overflow-hidden shadow-2xl`}>
                <div className={`${theme === 'space-light' ? 'p-6 border-b border-slate-200 bg-white/80' : 'p-6 border-b border-gray-800/50 bg-black/20'} flex justify-between items-center`}>
                    <h3 className={`text-xs font-black ${theme === 'space-light' ? 'text-slate-800' : 'text-gray-200'} uppercase tracking-[0.2em] flex items-center gap-2`}>
                        <List size={18} className={theme === 'gold' ? 'text-[#d4af37]' : (theme === 'space-light' ? 'text-slate-800' : 'text-[#00f2fe]')}/> {t('global_logs')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Hexagon size={14} className="text-[#d4af37]"/>
                        <span className={`${theme === 'space-light' ? 'text-slate-600' : 'text-gray-500'} text-[10px] font-black tracking-widest`}>SG TECHLAB {VERSION}</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 text-[10px] uppercase text-gray-500 font-black border-b border-gray-800/50">
                            <tr>
                                <th className="px-6 py-4">{t('log_date')}</th>
                                <th className="px-6 py-4">{t('order')}</th>
                                <th className="px-6 py-4">{t('log_worker')}</th>
                                <th className="px-6 py-4 text-right">{t('hours')}</th>
                                <th className="px-6 py-4 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50 text-xs">
                            {allLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-600 font-bold uppercase tracking-widest">{t('no_logs')}</td>
                                </tr>
                            ) : (
                                allLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-gray-500 font-mono">{log.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-black uppercase block ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{log.orderNumber}</span>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase">{log.client}</span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-300 uppercase">{log.worker}</td>
                                        <td className={`px-6 py-4 text-right font-black text-sm ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>{Number(log.hours || 0).toFixed(1)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setPasswordPrompt({ action: 'delete', orderId: log.orderId, logId: log.id })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};