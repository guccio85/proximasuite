
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkOrder, OrderStatus, AssignmentType, WorkerAvailability, TaskColors, GlobalDay, Language, RecurringAbsence } from '../types';
import { ChevronLeft, ChevronRight, Hash, Building, User, Palmtree, AlertCircle, Info, UserX, Ruler, Wrench, AlertTriangle, FileText, MapPin, Truck, Calendar as CalendarIcon, List, Hammer, PaintBucket, ClipboardList, Anvil, Layers, Minimize2, MoveVertical, X, Save, AlertOctagon, Check, Box, CalendarDays, Trash2, CheckCircle, Activity, Stethoscope, Briefcase } from 'lucide-react';
import { LongPressEditable } from './LongPressEditable';

interface WorkOrderTableProps {
  orders: WorkOrder[];
  availabilities: WorkerAvailability[];
  recurringAbsences?: RecurringAbsence[];
  onDateClick: (date: string) => void;
  onOrderClick?: (order: WorkOrder) => void;
  onInlineUpdate?: (orderId: string, field: keyof WorkOrder, value: string) => void;
  onDeleteOrder?: (orderId: string) => void; 
  viewMode: 'calendar' | 'list';
  baseFontSize: number;
  layoutSpacing?: number;
  
  taskColors?: TaskColors;
  globalDays?: GlobalDay[];
  
  rowHeight: number;
  isAutoHeight: boolean;
  dayColWidth: number;
  headerHeight: number; 
  cardFontSize?: number; 
  gridLineThickness?: number; 
  language?: Language;
}

export const WorkOrderTable: React.FC<WorkOrderTableProps> = ({ 
  orders, 
  availabilities,
  recurringAbsences = [],
  onDateClick, 
  onOrderClick,
  onInlineUpdate,
  onDeleteOrder,
  viewMode,
  baseFontSize,
  layoutSpacing = 10,
  taskColors = {
      kbw: '#fef9c3',       
      plw: '#dbeafe',       
      montage: '#fee2e2',   
      werkvoorbereid: '#ffedd5',
      holiday: '#dcfce7',   
      adv: '#e9d5ff'
  },
  globalDays = [],
  rowHeight, isAutoHeight, dayColWidth, headerHeight, cardFontSize = 14,
  gridLineThickness = 1,
  language = 'nl'
}) => {
  const [isExtendedView, setIsExtendedView] = useState(false);

  const DAYS_BEFORE = 3;
  const DAYS_AFTER = 30;
  const totalDaysToRender = isExtendedView ? 42 : (DAYS_BEFORE + 1 + DAYS_AFTER); 

  // Min rows for Infinite Grid effect
  const MIN_TOTAL_ROWS = 30; 

  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: {
            order: "Order", client: "Opdrachtgever", info: "Info", today: "Vandaag",
            no_orders: "Geen orders.",
            desc_title: "Beschrijving & Info",
            full_text: "Volledige Tekst",
            cancel: "Annuleren",
            save: "Opslaan",
            no_info: "Geen info...",
            project: "Project",
            treat: "Beh.",
            weeks_6: "6 Weken",
            delete: "Verwijder",
            ready: "GEREED",
            summary_title: "Status",
            absences_tooltip: "Afwezigheden",
            click_to_edit: "Klik om te lezen/bewerken",
            print: "Print Planner"
        },
        en: {
            order: "Order", client: "Client", info: "Info", today: "Today",
            no_orders: "No orders.",
            desc_title: "Description & Info",
            full_text: "Full Text",
            cancel: "Cancel",
            save: "Save",
            no_info: "No info...",
            project: "Project",
            treat: "Trt.",
            weeks_6: "6 Weeks",
            delete: "Delete",
            ready: "READY",
            summary_title: "Status",
            absences_tooltip: "Absences",
            click_to_edit: "Click to read/edit",
            print: "Print Planner"
        },
        it: {
            order: "Ordine", client: "Cliente", info: "Info", today: "Oggi",
            no_orders: "Nessun ordine.",
            desc_title: "Descrizione & Info",
            full_text: "Testo Completo",
            cancel: "Annulla",
            save: "Salva",
            no_info: "Nessuna info...",
            project: "Progetto",
            treat: "Tratt.",
            weeks_6: "6 Sett.",
            delete: "Elimina",
            ready: "PRONTO",
            summary_title: "Stato",
            absences_tooltip: "Assenze",
            click_to_edit: "Clicca per leggere/modificare",
            print: "Stampa Planner"
        }
    };
    return dict[language]?.[key] || key;
  };

  const getFixedStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - DAYS_BEFORE);
    return d;
  };

  const [startDate, setStartDate] = useState(getFixedStartDate);

  useEffect(() => {
      const checkMidnight = setInterval(() => {
          const currentStart = getFixedStartDate();
          if (currentStart.toDateString() !== startDate.toDateString()) {
              setStartDate(currentStart);
          }
      }, 60000); 
      return () => clearInterval(checkMidnight);
  }, [startDate]);

  const [colWidths, setColWidths] = useState({
    orderNumber: 60,     
    opdrachtgever: 140,  
    project: 120,        
    treatment: 50, 
    description: 150 
  });

  const posOrder = 0;
  const posClient = colWidths.orderNumber;
  const posProject = posClient + colWidths.opdrachtgever;
  const posTreat = posProject + colWidths.project;
  const posDesc = posTreat + colWidths.treatment;
  
  const totalFixedScrollWidth = posDesc + colWidths.description;

  const effectiveDayColWidth = isExtendedView ? 30 : Math.max(60, dayColWidth);
  const effectiveFontSize = cardFontSize;

  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [editingDescriptionOrder, setEditingDescriptionOrder] = useState<WorkOrder | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [photoLightbox, setPhotoLightbox] = useState<string | null>(null);

  const openDescriptionModal = (order: WorkOrder, e: React.MouseEvent) => {
      e.stopPropagation(); 
      setEditingDescriptionOrder(order);
      setTempDescription(order.description || '');
      setDescriptionModalOpen(true);
  };

  const saveDescription = () => {
      if (editingDescriptionOrder && onInlineUpdate) {
          onInlineUpdate(editingDescriptionOrder.id, 'description', tempDescription);
      }
      setDescriptionModalOpen(false);
      setEditingDescriptionOrder(null);
  };

  const cleanDescription = (desc?: string) => {
      if (!desc) return null;
      return desc.replace(/\[BEHANDELING:.*?\]/gi, '').trim();
  };

  const getInitials = (name: string | undefined) => {
      if (!name) return '';
      if (name.includes('+')) {
          return name.split('+').map(n => getInitials(n.trim())).join('+');
      }
      const parts = name.split(' ').filter(p => p.length > 0);
      if (parts.length === 0) return '';
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const parseAvailability = (typeStr: string) => {
      let mainType = typeStr;
      let duration = 'FULL';
      
      if (typeStr.includes('_')) {
          const parts = typeStr.split('_');
          mainType = parts[0];
          duration = parts[1];
      }
      return { mainType, duration };
  };

  const resizingRef = useRef<{ column: keyof typeof colWidths, startX: number, startWidth: number } | null>(null);

  const startResize = (e: React.MouseEvent, column: keyof typeof colWidths) => {
    if (column === 'treatment') return;
    e.preventDefault();
    resizingRef.current = { column, startX: e.clientX, startWidth: colWidths[column] };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingRef.current) return;
    const { column, startX, startWidth } = resizingRef.current;
    const diff = e.clientX - startX;
    setColWidths(prev => ({ ...prev, [column]: Math.max(50, startWidth + diff) }));
  };

  const handleMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  const days = useMemo(() => {
    const dates = [];
    const start = new Date(startDate); 
    
    for (let i = 0; i < totalDaysToRender; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate, totalDaysToRender]);

  const locale = language === 'it' ? 'it-IT' : language === 'en' ? 'en-GB' : 'nl-NL';

  const monthGroups = useMemo(() => {
    const groups: { name: string; count: number }[] = [];
    let currentMonthStr = "";
    days.forEach(day => {
        const monthStr = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(day);
        if (monthStr !== currentMonthStr) {
            groups.push({ name: monthStr, count: 1 });
            currentMonthStr = monthStr;
        } else {
            groups[groups.length - 1].count++;
        }
    });
    return groups;
  }, [days, locale]);

  const handlePrevWeek = () => { 
      const d = new Date(startDate); 
      d.setDate(d.getDate() - 7); 
      setStartDate(d); 
  };
  const handleNextWeek = () => { 
      const d = new Date(startDate); 
      d.setDate(d.getDate() + 7); 
      setStartDate(d); 
  };
  const handleToday = () => { 
      setStartDate(getFixedStartDate()); 
  };

  const getAssignmentStyle = (type?: AssignmentType, status?: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return 'bg-green-50 text-green-900';
      case OrderStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-900';
      case OrderStatus.PENDING: return 'bg-yellow-50 text-yellow-900';
      case OrderStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-white text-gray-800';
    }
  };

  const dateToIso = (date: Date) => date.toISOString().split('T')[0];

  // Helper to get recurring absences for a specific date
  const getRecurringAbsencesForDate = (dateIso: string) => {
    const result: Array<{ worker: string; type: string }> = [];
    const targetDate = new Date(dateIso);
    const targetDayOfWeek = targetDate.getDay();

    recurringAbsences.forEach(ra => {
      if (ra.dayOfWeek === targetDayOfWeek) {
        const startDate = new Date(ra.startDate);
        const daysElapsed = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksElapsed = Math.floor(daysElapsed / 7);

        if (daysElapsed >= 0 && weeksElapsed < ra.numberOfWeeks) {
          let typeStr = ra.type;
          if (ra.timeOfDay !== 'ALL_DAY') {
            typeStr = `${ra.type}_${ra.timeOfDay}`;
          }
          result.push({ worker: ra.worker, type: typeStr });
        }
      }
    });

    return result;
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = dateToIso(tomorrow);

  const getOrderConflicts = (order: WorkOrder) => {
    const conflicts: string[] = [];
    const checkConflict = (date?: string, workerString?: string, taskName?: string) => {
      if (!date || !workerString) return;
      const workers = workerString.split(' + ');
      workers.forEach(w => {
          const isAbsent = availabilities.some(a => a.date === date && a.worker === w && (a.type.startsWith('ABSENT') || a.type.startsWith('VACATION') || a.type.startsWith('SICK')));
          if (isAbsent) conflicts.push(`${w} is afwezig op ${taskName} (${date})`);
      });
    };
    checkConflict(order.measurementDate, order.measurementWorker, 'Meting');
    checkConflict(order.deliveryDate, order.deliveryWorker, 'Levering');
    checkConflict(order.installationDate, order.installationWorker, 'Montage');
    checkConflict(order.startDate, order.startWorker, 'Startdatum');
    checkConflict(order.endDate, order.endWorker, 'Einddatum');
    checkConflict(order.workPreparationWorker ? order.workPreparationDate : undefined, order.workPreparationWorker, 'Werkvoorbereiding');
    checkConflict(order.kbwDate ? order.kbwDate : undefined, order.kbwWorker, 'KBW');
    checkConflict(order.plwDate ? order.plwDate : undefined, order.plwWorker, 'PLW');
    if (order.assignedWorker && order.scheduledDate) checkConflict(order.scheduledDate, order.assignedWorker, 'Algemene Planning');
    return conflicts;
  };

  const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div onMouseDown={onMouseDown} className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 z-50 transition-colors" onClick={(e) => e.stopPropagation()} />
  );

  const stripedPattern = 'repeating-linear-gradient(45deg, #ffffff, #ffffff 10px, #fecaca 10px, #fecaca 20px)';
  const tomorrowGradient = 'linear-gradient(to bottom, #e0f2fe, #bae6fd)'; 

  const MONTH_HEADER_HEIGHT = 35; 
  const PRESENCE_ROW_HEIGHT = 20;

  const uniformRowHeight = Math.max(rowHeight, 24);

  const unifiedRowStyle: React.CSSProperties = {
      height: `${uniformRowHeight}px`,
      maxHeight: `${uniformRowHeight}px`, 
      minHeight: `${uniformRowHeight}px`,
      fontSize: `${effectiveFontSize}px`,
      whiteSpace: 'nowrap', 
      padding: 0,
      overflow: 'hidden' 
  };

  const cellInnerStyle: React.CSSProperties = {
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center', 
      paddingTop: '0',    
      paddingBottom: '0', 
      paddingLeft: '0',
      paddingRight: '0'
  };

  const borderStyle: React.CSSProperties = {
      borderWidth: `${gridLineThickness}px`,
      borderColor: '#000',
      borderStyle: 'solid'
  };

  const fillerRowCount = Math.max(0, MIN_TOTAL_ROWS - orders.length);
  const fillerRows = Array.from({ length: fillerRowCount });

  const TREATMENT_BADGES = [
      { key: 'thermischVerzinkt', label: 'TZ', style: 'bg-gray-200 text-gray-800 border-gray-300' },
      { key: 'stralen', label: 'STR', style: 'bg-gray-200 text-gray-800 border-gray-300' },
      { key: 'stralenPrimer', label: 'SP', style: 'bg-blue-100 text-blue-800 border-blue-200' },
      { key: 'schoopperenPrimer', label: 'SP', style: 'bg-purple-100 text-purple-800 border-purple-200' },
      { key: 'poedercoaten', label: 'PC', style: 'bg-red-100 text-red-800 border-red-200' },
      { key: 'natlakken', label: 'NL', style: 'bg-green-100 text-green-800 border-green-200' },
      { key: 'onbehandeld', label: 'ON', style: 'bg-white border-gray-300 text-gray-400' }
  ];

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden" style={{ fontSize: `${baseFontSize}px`, willChange: 'transform', transform: 'translateZ(0)' }}>
      {descriptionModalOpen && editingDescriptionOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
                  <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> {t('desc_title')}</h3>
                      <button onClick={() => setDescriptionModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500"/></button>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto">
                      <div className="mb-4 text-sm text-gray-600">
                          <span className="font-bold">{t('order')}:</span> {editingDescriptionOrder.orderNumber} <br/>
                          <span className="font-bold">{t('client')}:</span> {editingDescriptionOrder.opdrachtgever}
                      </div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('full_text')}</label>
                      <textarea value={tempDescription} onChange={(e) => setTempDescription(e.target.value)} className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-base leading-relaxed"/>
                  </div>
                  <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                      <button onClick={() => setDescriptionModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">{t('cancel')}</button>
                      <button onClick={saveDescription} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold flex items-center gap-2"><Save size={18} /> {t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      <div 
        className="flex items-center justify-between border-b shrink-0 text-base"
        style={{ padding: `${layoutSpacing}px`, borderColor: '#374151', borderBottomWidth: '1px' }}
      >
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={handlePrevWeek} className="p-1.5 bg-white border border-gray-400 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronLeft size={20} /></button>
          <button onClick={handleToday} className="px-3 py-1.5 bg-white border border-gray-400 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">{t('today')}</button>
          <button onClick={handleNextWeek} className="p-1.5 bg-white border border-gray-400 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronRight size={20} /></button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          <button 
            onClick={() => setIsExtendedView(!isExtendedView)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg font-bold text-sm transition-colors ${isExtendedView ? 'bg-indigo-600 text-white border-indigo-700 shadow-inner' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'}`}
            title="6 Weken overzicht"
          >
            <CalendarDays size={18} />
            <span className="hidden sm:inline">{t('weeks_6')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative w-full h-full overflow-hidden">
         {orders.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                 <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200 text-center">
                     <p className="text-gray-500 font-medium italic text-lg">{t('no_orders')}</p>
                 </div>
             </div>
         )}

         <div className="absolute inset-0 w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" style={{ isolation: 'isolate' }}>
            <table 
                className="snep-table h-full" 
                style={{ 
                    fontSize: '1em', 
                    width: isExtendedView ? 'max-content' : 'auto', 
                    tableLayout: 'fixed', 
                    borderLeft: '1px solid #374151', 
                    borderTop: '1px solid #374151' 
                }}
            >
            <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
                {/* 1. MONTH HEADER */}
                <tr className="bg-white">
                    <th colSpan={5} className="sticky left-0 top-0 z-[60] bg-gray-50" style={{ height: `${MONTH_HEADER_HEIGHT}px`, minWidth: totalFixedScrollWidth, width: totalFixedScrollWidth, maxWidth: totalFixedScrollWidth }}></th>
                    
                    {monthGroups.map((g, idx) => (
                        <th key={idx} colSpan={g.count} className="sticky top-0 z-50 bg-white/95 backdrop-blur text-blue-900 font-bold uppercase tracking-wider text-xs align-middle" style={{ height: `${MONTH_HEADER_HEIGHT}px`, textAlign: 'left', paddingLeft: '16px' }}>{g.name}</th>
                    ))}
                </tr>

                {/* 2. PRESENCE SUMMARY ROW */}
                <tr className="bg-white shadow-sm z-40">
                    <th className="sticky left-0 top-[35px] z-[55] bg-gray-50 p-1 text-right shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)] h-[20px]" style={{ ...borderStyle }} colSpan={5}>
                        <div className="flex items-center justify-end gap-2 text-[0.6em] font-bold text-gray-400 uppercase pr-2">
                            <Activity size={10} /> {t('summary_title')}
                        </div>
                    </th>
                    {days.map((day, i) => {
                        const isoDate = dateToIso(day);
                        const stdAbsences = availabilities.filter(a => a.date === isoDate && (a.type.startsWith('SICK') || a.type.startsWith('ABSENT') || a.type.startsWith('VACATION') || a.type.startsWith('ADV')));
                        const recurringAbs = getRecurringAbsencesForDate(isoDate);
                        const absences = [...stdAbsences, ...recurringAbs.map(ra => ({ id: ra.worker, worker: ra.worker, date: isoDate, type: ra.type }))];
                        
                        let bgColor = 'bg-transparent';
                        if (absences.length > 0) {
                            const hasSick = absences.some(a => a.type.startsWith('SICK'));
                            const hasVacation = absences.some(a => a.type.startsWith('VACATION') || a.type.startsWith('ADV'));
                            if (hasSick) bgColor = 'bg-red-100 text-red-700';
                            else if (hasVacation) bgColor = 'bg-orange-100 text-orange-700';
                            else bgColor = 'bg-gray-200 text-gray-700';
                        }

                        return (
                            <th key={`summary-${i}`} className={`p-0 align-middle sticky top-[35px] z-40 h-[20px] ${bgColor}`} style={{ ...borderStyle }}>
                                {absences.length > 0 && (
                                    <div className="relative w-full h-full flex items-center justify-center cursor-help group/tooltip" style={{ isolation: 'isolate' }}>
                                        <span className="text-[0.6em] font-bold">{absences.length}</span>
                                        {/* TOOLTIP - ABSOLUTE POSITIONED */}
                                        <div className="hidden group-hover/tooltip:flex group-hover/tooltip:flex-col absolute bg-slate-800 text-white text-[0.75em] px-3 py-2 rounded shadow-2xl z-[9999] text-left border border-slate-700 whitespace-nowrap" style={{
                                            top: '-80px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 'max-content'
                                        }}>
                                            <p className="font-bold border-b border-slate-600 mb-1 pb-1 text-xs whitespace-nowrap">{t('absences_tooltip')}</p>
                                            {absences.map((abs, idx) => {
                                                const parsed = parseAvailability(abs.type);
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 mb-0.5 whitespace-nowrap">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0"></div>
                                                        <span className="font-medium text-slate-300">{abs.worker}:</span>
                                                        <span className="text-white text-nowrap">{parsed.mainType} {parsed.duration !== 'FULL' ? `(${parsed.duration})` : ''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </th>
                        );
                    })}
                </tr>

                {/* 3. MAIN HEADER ROW (DAYS) */}
                <tr>
                {/* Fixed Columns Headers */}
                <th style={{ width: colWidths.orderNumber, minWidth: colWidths.orderNumber, left: posOrder, top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, height: `${headerHeight}px`, fontSize: `${effectiveFontSize}px`, padding: 0, ...borderStyle }} className="sticky z-[50] bg-gray-100 relative shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center w-full h-full p-0 m-0 gap-1 font-semibold text-gray-800 uppercase" style={{ fontSize: '0.8em' }}><Hash size={'1.2em'} /> {t('order')}</div>
                    <ResizeHandle onMouseDown={(e) => startResize(e, 'orderNumber')} />
                </th>
                <th style={{ width: colWidths.opdrachtgever, minWidth: colWidths.opdrachtgever, left: posClient, top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, height: `${headerHeight}px`, fontSize: `${effectiveFontSize}px`, padding: 0, ...borderStyle }} className="sticky z-[50] bg-gray-100 relative shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-start pl-2 w-full h-full gap-2 font-semibold text-gray-800 uppercase" style={{ fontSize: '0.8em', paddingLeft: '8px' }}><Building size={'1.2em'} /> {t('client')}</div>
                    <ResizeHandle onMouseDown={(e) => startResize(e, 'opdrachtgever')} />
                </th>
                <th style={{ width: colWidths.project, minWidth: colWidths.project, left: posProject, top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, height: `${headerHeight}px`, fontSize: `${effectiveFontSize}px`, padding: 0, ...borderStyle }} className="sticky z-[50] bg-gray-100 relative shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-start pl-2 w-full h-full gap-2 font-semibold text-gray-800 uppercase" style={{ fontSize: '0.8em', paddingLeft: '8px' }}><Box size={'1.2em'} /> {t('project')}</div>
                    <ResizeHandle onMouseDown={(e) => startResize(e, 'project')} />
                </th>
                <th style={{ width: colWidths.treatment, minWidth: colWidths.treatment, maxWidth: colWidths.treatment, left: posTreat, top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, height: `${headerHeight}px`, fontSize: `${effectiveFontSize}px`, padding: 0, ...borderStyle }} className="sticky z-[50] bg-gray-100 relative shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-center w-full h-full">
                        <PaintBucket size={16} className="mx-auto text-indigo-600" />
                    </div>
                </th>
                <th style={{ width: colWidths.description, minWidth: colWidths.description, left: posDesc, top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, height: `${headerHeight}px`, padding: 0, ...borderStyle }} className="sticky z-[50] bg-gray-100 relative shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-start pl-2 w-full h-full gap-2 text-[0.8em] font-semibold text-gray-800 uppercase" style={{ paddingLeft: '8px' }}><FileText size={'1.2em'} /> {t('info')}</div>
                    <ResizeHandle onMouseDown={(e) => startResize(e, 'description')} />
                </th>
                
                {/* Date Columns */}
                {days.map((day, i) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isoDate = dateToIso(day);
                    const isTomorrow = isoDate === tomorrowIso;
                    const globalStatus = globalDays?.find(d => d.date === isoDate);
                    
                    let headerBg = 'bg-gray-50';
                    let todayBorder = '';

                    if (globalStatus?.type === 'HOLIDAY') headerBg = 'bg-green-100'; 
                    else if (globalStatus?.type === 'ADV') headerBg = 'bg-purple-100'; 
                    else if (isToday) { 
                        headerBg = 'bg-blue-200'; 
                        todayBorder = `border-l-2 border-r-2 border-blue-600`;
                    }
                    else if (isTomorrow) { headerBg = 'bg-blue-50'; }
                    else if (isWeekend) headerBg = 'bg-gray-100/50'; // WEEKEND HEADER COLOR

                    const finalHeaderStyle: React.CSSProperties = {
                        width: effectiveDayColWidth, 
                        minWidth: effectiveDayColWidth, 
                        height: `${headerHeight}px`, 
                        top: `${MONTH_HEADER_HEIGHT + PRESENCE_ROW_HEIGHT}px`, 
                        zIndex: 40,
                        backgroundColor: globalStatus?.type === 'HOLIDAY' ? taskColors.holiday : globalStatus?.type === 'ADV' ? taskColors.adv : undefined,
                        backgroundImage: (!globalStatus && isTomorrow && !isToday && !isWeekend) ? tomorrowGradient : undefined,
                    };
                    
                    return (
                    <th key={i} onClick={() => onDateClick(isoDate)} className={`p-1 align-top cursor-pointer transition-colors group relative sticky ${headerBg} ${todayBorder} hover:opacity-90`} style={{ ...finalHeaderStyle, ...borderStyle }}>
                        <div className="flex flex-col items-center justify-start w-full h-full overflow-hidden">
                            <div className={`w-full text-center py-1 mb-1 ${isToday ? 'bg-blue-100/50' : ''}`} style={{ borderBottom: '1px solid #ccc' }}>
                                {!isExtendedView && (
                                    <div className={`text-[0.8em] font-bold uppercase truncate ${isToday ? 'text-blue-900' : 'text-gray-500'}`}>
                                        {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}
                                    </div>
                                )}
                                <div className={`truncate ${isToday ? 'font-bold text-blue-950' : 'font-medium text-gray-900'} ${isWeekend ? 'text-red-400' : ''}`} style={{ fontSize: isExtendedView ? '0.7em' : '1em' }}>
                                    {day.getDate()}
                                </div>
                            </div>
                            {globalStatus && !isExtendedView && <div className="mb-1"><span className="text-[0.6em] font-black uppercase px-1 py-0.5 rounded bg-white/50 text-gray-800 border border-black/10">{globalStatus.type === 'HOLIDAY' ? '★ FEESTDAG' : 'ADV'}</span></div>}
                        </div>
                    </th>
                    );
                })}
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => {
                    const conflicts = getOrderConflicts(order);
                    const rowStyle = { ...unifiedRowStyle };
                    const cleanedDescription = cleanDescription(order.description);
                    const activeBadges = TREATMENT_BADGES.filter(t => (order as any)[t.key]);

                    return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    {/* 1. ORDER */}
                    <td onClick={() => onOrderClick && onOrderClick(order)} style={{ width: colWidths.orderNumber, minWidth: colWidths.orderNumber, left: posOrder, padding: 0, ...rowStyle, ...borderStyle }} className="sticky z-30 bg-white group-hover:bg-gray-50 font-medium text-[1em] text-gray-900 cursor-pointer hover:text-blue-600 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div style={{...cellInnerStyle, justifyContent: 'center'}}>
                            <div className={`flex items-center justify-center gap-1 h-full overflow-hidden w-full relative`}>
                                {/* READY BADGE */}
                                {order.readyForArchive && (
                                    <div className="absolute left-0 top-0 text-green-500 animate-pulse bg-green-50 p-0.5 rounded-br z-10" title={t('ready')}>
                                        <CheckCircle size={10} fill="currentColor" className="text-white"/>
                                    </div>
                                )}

                                {/* DELETE BUTTON */}
                                {onDeleteOrder && viewMode === 'list' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                                        className="absolute left-0.5 top-1/2 -translate-y-1/2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                        title={t('delete')}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}

                                {conflicts.length > 0 && <div><AlertTriangle size={'1.2em'} className="text-red-600 animate-pulse shrink-0" /></div>}
                                {order.missingAssignment && <div title="Ditta/lavoratore mancante"><AlertTriangle size={'1.1em'} className="text-amber-500 animate-pulse shrink-0" /></div>}
                                <div className="truncate whitespace-nowrap"><LongPressEditable value={order.orderNumber} onSave={(val) => onInlineUpdate && onInlineUpdate(order.id, 'orderNumber', val)} /></div>
                            </div>
                        </div>
                    </td>
                    {/* 2. CLIENT */}
                    <td onClick={() => onOrderClick && onOrderClick(order)} style={{ width: colWidths.opdrachtgever, minWidth: colWidths.opdrachtgever, left: posClient, ...rowStyle, ...borderStyle }} className="sticky z-30 bg-white group-hover:bg-gray-50 text-[1em] cursor-pointer align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div style={{...cellInnerStyle, paddingLeft: '8px', justifyContent: 'flex-start'}}>
                            <div className="text-gray-900 hover:text-blue-600 font-bold truncate w-full flex items-center h-full gap-1">
                                <LongPressEditable value={order.opdrachtgever} onSave={(val) => onInlineUpdate && onInlineUpdate(order.id, 'opdrachtgever', val)} />
                                {order.photos && order.photos.length > 0 && order.photos[0].startsWith('http') && (
                                    <img
                                        src={order.photos[0]}
                                        alt="foto"
                                        onClick={(e) => { e.stopPropagation(); setPhotoLightbox(order.photos![0]); }}
                                        className="w-7 h-7 rounded object-cover shrink-0 border border-gray-200 cursor-zoom-in hover:opacity-80 transition-opacity"
                                    />
                                )}
                            </div>
                        </div>
                    </td>
                    {/* 3. PROJECT */}
                    <td onClick={() => onOrderClick && onOrderClick(order)} style={{ width: colWidths.project, minWidth: colWidths.project, left: posProject, ...rowStyle, ...borderStyle }} className="sticky z-30 bg-white group-hover:bg-gray-50 text-[0.9em] cursor-pointer align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div style={{...cellInnerStyle, paddingLeft: '8px', justifyContent: 'flex-start'}}>
                            <div className="text-gray-600 font-medium truncate w-full flex items-center h-full">
                                <LongPressEditable value={order.projectRef || ""} placeholder="Werk/Project..." onSave={(val) => onInlineUpdate && onInlineUpdate(order.id, 'projectRef', val)} />
                            </div>
                        </div>
                    </td>
                    {/* 4. BEHANDELING */}
                    <td style={{ width: colWidths.treatment, minWidth: colWidths.treatment, maxWidth: colWidths.treatment, left: posTreat, padding: 0, ...rowStyle, ...borderStyle }} className="sticky z-30 bg-white group-hover:bg-gray-50 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div style={{...cellInnerStyle, justifyContent: 'center'}}>
                            <div className={`w-full h-full flex flex-wrap content-center justify-center p-0 gap-0.5`}>
                                {activeBadges.map(badge => (
                                    <span 
                                        key={badge.key} 
                                        className={`${badge.style} text-[8px] font-bold leading-none flex items-center justify-center w-[14px] h-[14px] rounded-sm`} 
                                        style={{ border: 'none', boxShadow: 'none' }}
                                        title={badge.label}
                                    >
                                        {badge.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </td>
                    {/* 5. INFO */}
                    <td onClick={(e) => openDescriptionModal(order, e)} style={{ width: colWidths.description, minWidth: colWidths.description, maxWidth: colWidths.description, left: posDesc, ...rowStyle, ...borderStyle }} className="sticky z-30 bg-white group-hover:bg-blue-50 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)] text-[0.9em] text-gray-600 align-top cursor-pointer transition-colors" title={t('click_to_edit')}>
                        <div style={{...cellInnerStyle, paddingLeft: '8px', justifyContent: 'flex-start'}}>
                            <div className="truncate w-full whitespace-nowrap overflow-hidden text-ellipsis flex items-center h-full">
                                {cleanedDescription || <span className="text-gray-300 italic text-xs">{t('no_info')}</span>}
                            </div>
                        </div>
                    </td>
                    {days.map((day, i) => {
                        const isoDate = dateToIso(day);
                        const isToday = new Date().toDateString() === day.toDateString();
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const isTomorrow = isoDate === tomorrowIso;
                        const globalStatus = globalDays?.find(d => d.date === isoDate);

                        const isSubcontractedRange = order.isSubcontracted && order.subcontractorDeliveryDate && !isWeekend && isoDate >= order.scheduledDate && isoDate <= order.subcontractorDeliveryDate;
                        const isStartDate = isoDate === order.startDate;
                        const isEndDate = isoDate === order.endDate;
                        const isMeasurement = isoDate === order.measurementDate;
                        const isDelivery = isoDate === order.deliveryDate;
                        const presStart = order.preservationDate;
                        const presEnd = order.preservationEndDate || presStart;
                        const hasPreservationFlag = order.poedercoaten || order.stralenPrimer || order.schoopperenPrimer || order.natlakken || order.thermischVerzinkt;
                        const isPreservation = presStart && isoDate >= presStart && isoDate <= presEnd && hasPreservationFlag;
                        const prepStart = order.workPreparationDate;
                        const prepEnd = order.workPreparationEndDate || prepStart;
                        const isPreparation = prepStart && isoDate >= prepStart && isoDate <= prepEnd;
                        const installStart = order.installationDate;
                        const installEnd = order.installationEndDate || installStart;
                        const isInstallation = installStart && isoDate >= installStart && isoDate <= installEnd;
                        const kbwStart = order.kbwDate;
                        const kbwEnd = order.kbwEndDate || kbwStart;
                        const isKbw = kbwStart && isoDate >= kbwStart && isoDate <= kbwEnd;
                        const plwStart = order.plwDate;
                        const plwEnd = order.plwEndDate || plwStart;
                        const isPlw = plwStart && isoDate >= plwStart && isoDate <= plwEnd;
                        const inRange = order.startDate && order.endDate && isoDate > order.startDate && isoDate < order.endDate;

                        // --- NEW LOGIC: SPLIT COLORS (v6.8.51) ---
                        const activeTasks: { bg: string, text: string }[] = [];
                        if (!isWeekend && !globalStatus) {
                            if (isSubcontractedRange) activeTasks.push({ bg: '#e0e7ff', text: '#3730a3' }); // Indigo
                            if (isKbw) activeTasks.push({ bg: taskColors.kbw, text: '#854d0e' });
                            if (isPlw) activeTasks.push({ bg: taskColors.plw, text: '#1e40af' });
                            if (isInstallation) activeTasks.push({ bg: taskColors.montage, text: '#991b1b' });
                            if (isPreparation || isMeasurement) activeTasks.push({ bg: taskColors.werkvoorbereid, text: '#7c2d12' });
                            if (isPreservation) activeTasks.push({ bg: '#fee2e2', text: '#7f1d1d' }); // Pinkish for preservation slice
                        }

                        let cellStyle: React.CSSProperties = {};
                        let cellClass = '';
                        let cellTextColor = undefined;

                        if (globalStatus) {
                            cellStyle.backgroundColor = globalStatus.type === 'HOLIDAY' ? taskColors.holiday : taskColors.adv;
                        } else if (isWeekend) {
                            cellClass = 'bg-gray-100/50';
                        } else if (activeTasks.length > 1) {
                            // GENERATE MULTI-COLOR GRADIENT
                            const step = 100 / activeTasks.length;
                            const gradientParts = activeTasks.map((t, idx) => 
                                `${t.bg} ${idx * step}%, ${t.bg} ${(idx + 1) * step}%`
                            );
                            cellStyle.backgroundImage = `linear-gradient(to right, ${gradientParts.join(', ')})`;
                            cellTextColor = activeTasks[0].text; // Use first text color as default
                        } else if (activeTasks.length === 1) {
                            cellStyle.backgroundColor = activeTasks[0].bg;
                            cellTextColor = activeTasks[0].text;
                        } else if (isTomorrow) {
                            cellStyle.backgroundImage = tomorrowGradient;
                        }

                        if (isToday) {
                            cellClass += ' border-l-2 border-r-2 border-blue-600 bg-blue-50';
                        }

                        const effectivelyHasActivity = activeTasks.length > 0 || isStartDate || isEndDate || isDelivery;
                        const defaultStyleClass = getAssignmentStyle(order.assignmentType, order.status);

                        return (
                        <td key={i} className={`p-0 relative align-top ${cellClass}`} style={{ width: effectiveDayColWidth, minWidth: effectiveDayColWidth, ...rowStyle, ...borderStyle }}>
                            {inRange && !isWeekend && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div></div></div>}
                            
                            {effectivelyHasActivity && !isWeekend && (
                            <div className={`m-0 p-0 rounded-md border shadow-sm flex flex-col justify-center relative overflow-hidden min-h-0 ${activeTasks.length === 0 ? defaultStyleClass : ''}`} style={{ ...cellStyle, color: cellTextColor, height: `${Math.max(16, uniformRowHeight - 4)}px`, maxHeight: `${Math.max(16, uniformRowHeight - 4)}px` }}>
                                <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                                    {!isExtendedView ? (
                                        <>
                                            {isStartDate && <span className="text-[0.7em] font-black bg-green-200 text-green-800 px-1 rounded uppercase tracking-tighter truncate max-w-full" title={order.startWorker}>S</span>}
                                            {isEndDate && <span className="text-[0.7em] font-black bg-red-200 text-red-800 px-1 rounded uppercase tracking-tighter truncate max-w-full" title={order.endWorker}>E</span>}
                                            {isMeasurement && <span className="text-[0.7em] font-bold bg-white/50 border border-black/10 px-1 rounded flex items-center gap-0.5 truncate max-w-full" title={order.measurementWorker}><Ruler size={'0.9em'} /></span>}
                                            {isDelivery && <span className="text-[0.7em] font-bold bg-cyan-200 text-cyan-800 px-1 rounded flex items-center gap-0.5 truncate max-w-full" title={order.deliveryWorker}><Truck size={'0.9em'} /></span>}
                                            {isInstallation && <span className="text-[0.7em] font-bold px-1 rounded flex items-center gap-0.5 truncate max-w-full bg-white/50 border border-black/10" title={`Montage: ${order.installationWorker || 'Niemand'}`}><Wrench size={'0.9em'} /></span>}
                                            {isPreparation && <span className="text-[0.7em] font-bold px-1 rounded flex items-center gap-0.5 truncate max-w-full bg-white/50 border border-black/10" title={`Prep: ${order.workPreparationWorker || 'Niemand'}`}><ClipboardList size={'0.9em'} /></span>}
                                            {isKbw && <span className="text-[0.7em] font-bold px-1 rounded flex items-center gap-0.5 truncate max-w-full bg-white/50 border border-black/10" title={`KBW: ${order.kbwWorker || 'Niemand'}`}><Anvil size={'0.9em'} /></span>}
                                            {isPlw && <span className="text-[0.7em] font-bold px-1 rounded flex items-center gap-0.5 truncate max-w-full bg-white/50 border border-black/10" title={`PLW: ${order.plwWorker || 'Niemand'}`}><Layers size={'0.9em'} /></span>}
                                            {isPreservation && <span className="text-[0.7em] font-bold px-1 rounded flex items-center gap-0.5 truncate max-w-full bg-white border border-gray-300 text-gray-900 shadow-sm" title={`Conservering: ${order.preservationType}`}><PaintBucket size={'0.9em'} /></span>}
                                        </>
                                    ) : (
                                        <div className="w-full flex justify-center items-center">
                                            {isSubcontractedRange && <div className="w-2 h-2 rounded-full bg-indigo-800"></div>}
                                            {isInstallation && <div className="w-2 h-2 rounded-full bg-red-800"></div>}
                                            {isKbw && <div className="w-2 h-2 rounded-full bg-yellow-800"></div>}
                                            {isPlw && <div className="w-2 h-2 rounded-full bg-blue-800"></div>}
                                        </div>
                                    )}
                                </div>
                                {!isExtendedView && !isSubcontractedRange && (
                                    <div className="mt-0.5 pt-0.5 border-t border-black/10 flex items-center gap-1 font-bold text-[0.8em] opacity-80 overflow-hidden">
                                        <User size={'1em'} />
                                        <span className="truncate">
                                            {getInitials(isPreparation ? order.workPreparationWorker : isInstallation ? order.installationWorker : isKbw ? order.kbwWorker : isPlw ? order.plwWorker : order.assignedWorker)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            )}
                        </td>
                        );
                    })}
                    </tr>
                )})}

                {fillerRows.map((_, idx) => (
                    <tr key={`filler-${idx}`} className="bg-white hover:bg-gray-50/50" style={{ height: `${uniformRowHeight}px` }}>
                        <td style={{ ...unifiedRowStyle, left: posOrder, ...borderStyle, willChange: 'transform' }} className="sticky z-30 bg-white">&nbsp;</td>
                        <td style={{ ...unifiedRowStyle, left: posClient, ...borderStyle, willChange: 'transform' }} className="sticky z-30 bg-white">&nbsp;</td>
                        <td style={{ ...unifiedRowStyle, left: posProject, ...borderStyle, willChange: 'transform' }} className="sticky z-30 bg-white">&nbsp;</td>
                        <td style={{ ...unifiedRowStyle, left: posTreat, ...borderStyle, willChange: 'transform' }} className="sticky z-30 bg-white">&nbsp;</td>
                        <td style={{ ...unifiedRowStyle, left: posDesc, ...borderStyle, willChange: 'transform' }} className="sticky z-30 bg-white">&nbsp;</td>
                        {days.map((day, dIdx) => (
                            <td key={dIdx} className={`${dateToIso(day) === dateToIso(new Date()) ? 'bg-blue-50/30' : (day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-100/50' : '')}`} style={{ width: effectiveDayColWidth, minWidth: effectiveDayColWidth, ...unifiedRowStyle, ...borderStyle, willChange: 'transform' }}>&nbsp;</td>
                        ))}
                    </tr>
                ))}
            </tbody>
            </table>
         </div>
      </div>
      {/* PHOTO LIGHTBOX */}
      {photoLightbox && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={() => setPhotoLightbox(null)}>
              <img src={photoLightbox} className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl" alt="foto" />
              <button onClick={() => setPhotoLightbox(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"><X size={24} /></button>
          </div>
      )}
    </div>
  );
};
