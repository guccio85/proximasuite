
import React, { useState, useMemo } from 'react';
import { WorkOrder, WorkerAvailability, Language, RecurringAbsence } from '../types';
import { ChevronLeft, ChevronRight, User, Users, Palmtree, AlertCircle, Ruler, Wrench, ArrowRightLeft, Briefcase, Truck, Stethoscope, UserX, Clock, Activity, Plus, Trash2, X } from 'lucide-react';

interface TeamScheduleProps {
  workers: string[];
  orders: WorkOrder[];
  availabilities: WorkerAvailability[];
  recurringAbsences: RecurringAbsence[];
  onAddRecurringAbsence?: (absence: RecurringAbsence) => void;
  onDeleteRecurringAbsence?: (id: string) => void;
  baseFontSize: number;
  layoutSpacing?: number; 
  onOrderClick?: (order: WorkOrder) => void;
  onAvailabilityClick?: (availability: WorkerAvailability) => void;
  language?: Language;
  gridLineThickness?: number;
}

export const TeamSchedule: React.FC<TeamScheduleProps> = ({ 
  workers, 
  orders, 
  availabilities,
  recurringAbsences = [],
  onAddRecurringAbsence,
  onDeleteRecurringAbsence,
  baseFontSize, 
  layoutSpacing = 10, 
  onOrderClick, 
  onAvailabilityClick,
  language = 'nl',
  gridLineThickness = 1
}) => {
  const [startDate, setStartDate] = useState(new Date());
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [formData, setFormData] = useState({
    worker: '',
    type: 'SICK' as any,
    timeOfDay: 'ALL_DAY' as any,
    startDate: new Date().toISOString().split('T')[0],
    numberOfWeeks: 1
  });

  // Translations
  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
        nl: {
            title: "Team Rooster",
            today: "Vandaag",
            worker: "Werknemer",
            empty: "Nog geen personeel toegevoegd. Ga naar \"Personeel Lijst\" om te beginnen.",
            sick: "Ziek",
            absent: "Afwezig",
            vacation: "Vakantie",
            add_absence: "Afwezigheid Toevoegen",
            select_worker: "Selecteer Werknemer",
            type: "Type",
            time_of_day: "Moment",
            start_date: "Startdatum",
            weeks: "Aantal Weken",
            morning: "Ochtend (08:00-12:00)",
            afternoon: "Middag (12:30-16:30)",
            all_day: "Volledige Dag",
            add: "Toevoegen",
            cancel: "Annuleren",
            recurring_absence: "Herhalende Afwezigheid",
            recurring_absences: "Herhalende Afwezigheden"
        },
        en: {
            title: "Team Schedule",
            today: "Today",
            worker: "Worker",
            empty: "No staff added yet. Go to \"Staff List\" to start.",
            sick: "Sick",
            absent: "Absent",
            vacation: "Vacation",
            add_absence: "Add Absence",
            select_worker: "Select Worker",
            type: "Type",
            time_of_day: "Time of Day",
            start_date: "Start Date",
            weeks: "Number of Weeks",
            morning: "Morning (08:00-12:00)",
            afternoon: "Afternoon (12:30-16:30)",
            all_day: "Full Day",
            add: "Add",
            cancel: "Cancel",
            recurring_absence: "Recurring Absence",
            recurring_absences: "Recurring Absences"
        },
        it: {
            title: "Orari Team",
            today: "Oggi",
            worker: "Dipendente",
            empty: "Nessun dipendente aggiunto. Vai su \"Lista Personale\" per iniziare.",
            sick: "Malattia",
            absent: "Assenza",
            vacation: "Ferie",
            add_absence: "Aggiungi Assenza",
            select_worker: "Seleziona Dipendente",
            type: "Tipo",
            time_of_day: "Momento della Giornata",
            start_date: "Data Inizio",
            weeks: "Numero Settimane",
            morning: "Mattina (08:00-12:00)",
            afternoon: "Pomeriggio (12:30-16:30)",
            all_day: "Intera Giornata",
            add: "Aggiungi",
            cancel: "Annulla",
            recurring_absence: "Assenza Ricorrente",
            recurring_absences: "Assenze Ricorrenti"
        }
    };
    return dict[language]?.[key] || key;
  };

  const locale = language === 'it' ? 'it-IT' : language === 'en' ? 'en-GB' : 'nl-NL';

  // Generate 14 days window (2 weeks)
  const days = useMemo(() => {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 14; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [startDate]);

  const handlePrevWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 7);
    setStartDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 7);
    setStartDate(newDate);
  };

  const handleToday = () => {
    setStartDate(new Date());
  };

  const dateToIso = (date: Date) => date.toISOString().split('T')[0];

  const handleAddAbsence = () => {
    if (!formData.worker.trim() || !formData.startDate) return;
    
    const startDate = new Date(formData.startDate);
    const dayOfWeek = startDate.getDay();
    
    const absence: RecurringAbsence = {
      id: Date.now().toString(),
      worker: formData.worker,
      type: formData.type,
      timeOfDay: formData.timeOfDay,
      dayOfWeek: dayOfWeek,
      startDate: formData.startDate,
      numberOfWeeks: formData.numberOfWeeks,
      note: ''
    };
    
    onAddRecurringAbsence?.(absence);
    setFormData({
      worker: '',
      type: 'SICK',
      timeOfDay: 'ALL_DAY',
      startDate: new Date().toISOString().split('T')[0],
      numberOfWeeks: 1
    });
    setShowAbsenceForm(false);
  };

  // Calculate all dates from recurring absences for display
  const getRecurringAbsencesForDate = (worker: string, dateIso: string) => {
    const absences: any[] = [];
    recurringAbsences.forEach(ra => {
      if (ra.worker === worker) {
        const targetDate = new Date(dateIso);
        const targetDayOfWeek = targetDate.getDay();
        
        if (targetDayOfWeek === ra.dayOfWeek) {
          const startDate = new Date(ra.startDate);
          const diff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksElapsed = Math.floor(diff / 7);
          
          if (weeksElapsed >= 0 && weeksElapsed < ra.numberOfWeeks) {
            absences.push(ra);
          }
        }
      }
    });
    return absences;
  };

  // Helper to parse availability composite types (e.g. SICK_MORNING)
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

  // Helper to find all activities for a worker on a specific date
  const getWorkerActivities = (worker: string, dateIso: string) => {
    const activities: any[] = [];

    // 1. Check Availability (Sick/Vacation/Absent) - Priority
    const userAvailabilities = availabilities.filter(a => a.worker === worker && a.date === dateIso);
    
    userAvailabilities.forEach(availability => {
        const { mainType, duration } = parseAvailability(availability.type);
        
        let label = '';
        let icon = AlertCircle;
        let color = 'bg-gray-100 text-gray-800';
        let sub = '';

        if (mainType === 'SICK') {
            label = t('sick');
            icon = Stethoscope;
            color = 'bg-red-50 text-red-700 border-red-200';
        } else if (mainType === 'ABSENT') {
            label = t('absent');
            icon = UserX;
            color = 'bg-gray-100 text-gray-700 border-gray-300';
        } else if (mainType === 'VACATION' || mainType === 'ADV') {
            label = t('vacation');
            icon = Palmtree;
            color = 'bg-orange-100 text-orange-800 border-orange-200';
        }

        // Determine Duration Style
        let gradientStyle = {};
        if (duration === 'MORNING') {
            sub = '08:00 - 12:00';
            gradientStyle = { background: `linear-gradient(to right, var(--tw-gradient-from) 60%, transparent 100%)` };
        } else if (duration === 'AFTERNOON') {
            sub = '12:30 - 16:30';
            gradientStyle = { background: `linear-gradient(to left, var(--tw-gradient-from) 60%, transparent 100%)` };
        }

        activities.push({ 
            type: mainType, 
            label, 
            icon, 
            color, 
            gradientStyle,
            order: null,
            availability: availability,
            sub
        });
    });

    // 1b. Check Recurring Absences
    const recurringAbs = getRecurringAbsencesForDate(worker, dateIso);
    recurringAbs.forEach(ra => {
        let label = '';
        let icon = AlertCircle;
        let color = 'bg-gray-100 text-gray-800';
        
        if (ra.type === 'SICK') {
            label = t('sick');
            icon = Stethoscope;
            color = 'bg-red-50 text-red-700 border-red-200';
        } else if (ra.type === 'ABSENT') {
            label = t('absent');
            icon = UserX;
            color = 'bg-gray-100 text-gray-700 border-gray-300';
        } else if (ra.type === 'VACATION') {
            label = t('vacation');
            icon = Palmtree;
            color = 'bg-orange-100 text-orange-800 border-orange-200';
        }
        
        let gradientStyle = {};
        let sub = '';
        if (ra.timeOfDay === 'MORNING') {
            sub = '08:00 - 12:00';
            gradientStyle = { background: `linear-gradient(to right, var(--tw-gradient-from) 60%, transparent 100%)` };
        } else if (ra.timeOfDay === 'AFTERNOON') {
            sub = '12:30 - 16:30';
            gradientStyle = { background: `linear-gradient(to left, var(--tw-gradient-from) 60%, transparent 100%)` };
        }
        
        activities.push({
            type: ra.type,
            label,
            icon,
            color,
            gradientStyle,
            order: null,
            availability: null,
            sub
        });
    });

    // 2. Check Orders assignments
    orders.forEach(order => {
      if (order.startWorker === worker && order.startDate === dateIso) {
        activities.push({ type: 'START', label: `Start: ${order.orderNumber}`, sub: '', icon: ArrowRightLeft, color: 'bg-green-100 text-green-800 border-green-200', order: order });
      }
      if (order.endWorker === worker && order.endDate === dateIso) {
        activities.push({ type: 'END', label: `${language === 'it' ? 'Fine' : 'End'}: ${order.orderNumber}`, sub: '', icon: ArrowRightLeft, rotateIcon: true, color: 'bg-red-50 text-red-800 border-red-200', order: order });
      }
      if (order.measurementWorker === worker && order.measurementDate === dateIso) {
        activities.push({ type: 'MEASURE', label: `${language === 'it' ? 'Misura' : 'Measure'}: ${order.orderNumber}`, sub: '', icon: Ruler, color: 'bg-purple-100 text-purple-800 border-purple-200', order: order });
      }
      if (order.deliveryWorker === worker && order.deliveryDate === dateIso) {
        activities.push({ type: 'DELIVERY', label: `${language === 'it' ? 'Consegna' : 'Delivery'}: ${order.orderNumber}`, sub: '', icon: Truck, color: 'bg-cyan-100 text-cyan-800 border-cyan-200', order: order });
      }
      if (order.installationWorker === worker && order.installationDate === dateIso) {
        activities.push({ type: 'INSTALL', label: `${language === 'it' ? 'Montaggio' : 'Install'}: ${order.orderNumber}`, sub: '', icon: Wrench, color: 'bg-orange-100 text-orange-800 border-orange-200', order: order });
      }
      if (order.assignedWorker === worker && order.scheduledDate === dateIso) {
        const isDuplicate = activities.some(a => a.label.includes(order.orderNumber));
        if (!isDuplicate) {
             activities.push({ type: 'MAIN', label: `${language === 'it' ? 'Lavoro' : 'Work'}: ${order.orderNumber}`, sub: '', icon: Briefcase, color: 'bg-blue-100 text-blue-800 border-blue-200', order: order });
        }
      }
    });

    return activities;
  };

  const sortedWorkers = [...workers].sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ fontSize: `${baseFontSize}px` }}>
      {/* Header Controls */}
      <div 
        className="flex items-center justify-between border-b border-gray-200 bg-gray-50 shrink-0 text-base"
        style={{ padding: `${layoutSpacing}px` }}
      >
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600"/>
            {t('title')}
        </h2>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <button onClick={handlePrevWeek} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronLeft size={20} /></button>
            <button onClick={handleToday} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">{t('today')}</button>
            <button onClick={handleNextWeek} className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"><ChevronRight size={20} /></button>
            </div>
            <div className="text-sm font-medium text-gray-600 w-32 text-right">
            {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(startDate)}
            </div>
        </div>
      </div>

      {/* Add Absence Form */}
      {showAbsenceForm && (
        <div className="border-b border-gray-200 bg-blue-50 p-4">
          <div className="grid grid-cols-6 gap-3 items-end">
            <div>
              <label className="text-xs font-bold text-gray-600">{t('select_worker')}</label>
              <select value={formData.worker} onChange={(e) => setFormData({...formData, worker: e.target.value})} className="w-full p-2 border rounded text-sm bg-white">
                <option value="">{t('select_worker')}</option>
                {workers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">{t('type')}</label>
              <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as any})} className="w-full p-2 border rounded text-sm bg-white">
                <option value="SICK">{t('sick')}</option>
                <option value="ABSENT">{t('absent')}</option>
                <option value="VACATION">{t('vacation')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">{t('time_of_day')}</label>
              <select value={formData.timeOfDay} onChange={(e) => setFormData({...formData, timeOfDay: e.target.value as any})} className="w-full p-2 border rounded text-sm bg-white">
                <option value="ALL_DAY">{t('all_day')}</option>
                <option value="MORNING">{t('morning')}</option>
                <option value="AFTERNOON">{t('afternoon')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">{t('start_date')}</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full p-2 border rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">{t('weeks')}</label>
              <input type="number" min="1" max="52" value={formData.numberOfWeeks} onChange={(e) => setFormData({...formData, numberOfWeeks: parseInt(e.target.value) || 1})} className="w-full p-2 border rounded text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddAbsence} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700">{t('add')}</button>
              <button onClick={() => setShowAbsenceForm(false)} className="px-3 py-2 bg-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-400"><X size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Add Absence Button */}
      {!showAbsenceForm && (
        <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-end">
          <button onClick={() => setShowAbsenceForm(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700"><Plus size={16} /> {t('add_absence')}</button>
        </div>
      )}

      {/* Recurring Absences List */}
      {recurringAbsences.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-bold text-gray-600 mb-2">{t('recurring_absences')}:</div>
          <div className="flex flex-wrap gap-2">
            {recurringAbsences.map(ra => (
              <div key={ra.id} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded flex items-center gap-2">
                <span>{ra.worker} - {ra.type} ({ra.numberOfWeeks}w)</span>
                <button onClick={() => onDeleteRecurringAbsence?.(ra.id)} className="text-red-500 hover:text-red-700"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div className="flex-1 overflow-auto bg-gray-50/50 w-full relative isolate">
        <table className="border-collapse w-full" style={{ fontSize: '14px !important', tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0 z-40">
            <tr>
              {/* Sticky Worker Column Header */}
              <th className="sticky left-0 top-0 z-50 bg-white p-3 text-left shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]" style={{ width: '200px', borderWidth: `${gridLineThickness}px`, borderColor: '#000', borderStyle: 'solid' }}>
                <div className="flex items-center gap-2 text-[0.8em] font-semibold text-gray-500 uppercase">
                  <User size={'1.2em'} /> {t('worker')}
                </div>
              </th>
              
              {/* Date Columns */}
              {days.map((day, i) => {
                const isToday = new Date().toDateString() === day.toDateString();
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <th key={i} className={`p-2 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`} style={{ width: '140px', borderWidth: `${gridLineThickness}px`, borderColor: '#000', borderStyle: 'solid' }}>
                    <div className="text-center">
                        <div className={`text-[0.7em] font-bold uppercase ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                            {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}
                        </div>
                        <div className={`text-[1em] ${isToday ? 'font-bold text-blue-900' : 'font-medium text-gray-900'} ${isWeekend ? 'text-red-400' : ''}`}>
                            {day.getDate()} {new Intl.DateTimeFormat(locale, { month: 'short' }).format(day)}
                        </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedWorkers.length === 0 ? (
                 <tr>
                    <td colSpan={days.length + 1} className="p-8 text-center text-gray-500 italic">
                        {t('empty')}
                    </td>
                 </tr>
            ) : (
                sortedWorkers.map(worker => (
                <tr key={worker} className="hover:bg-gray-50 transition-colors">
                    {/* Sticky Worker Name */}
                    <td className="sticky left-0 z-30 bg-white p-3 font-medium text-[1em] text-gray-900 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.1)]" style={{ borderWidth: `${gridLineThickness}px`, borderColor: '#000', borderStyle: 'solid' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[0.8em] font-bold border border-slate-200">
                            {worker.substring(0, 2).toUpperCase()}
                        </div>
                        {worker}
                    </div>
                    </td>

                    {/* Date Cells */}
                    {days.map((day, i) => {
                        const isoDate = dateToIso(day);
                        const isToday = new Date().toDateString() === day.toDateString();
                        const activities = getWorkerActivities(worker, isoDate);

                        return (
                            <td key={i} className={`p-1 align-top h-24 ${isToday ? 'bg-blue-50/20' : ''}`} style={{ width: '140px', borderWidth: `${gridLineThickness}px`, borderColor: '#000', borderStyle: 'solid' }}>
                                <div className="flex flex-col gap-1 h-full overflow-y-auto max-h-32">
                                    {activities.map((act, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                if (act.order && onOrderClick) {
                                                    onOrderClick(act.order);
                                                } else if (act.availability && onAvailabilityClick) {
                                                    onAvailabilityClick(act.availability);
                                                }
                                            }}
                                            className={`p-1.5 rounded-md border shadow-sm ${act.color} flex flex-col gap-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
                                            style={{ ...act.gradientStyle, fontSize: '11px' }} 
                                        >
                                            <div className="flex items-center gap-1 font-bold">
                                                <act.icon size={'1em'} className={act.rotateIcon ? 'transform rotate-180' : ''} />
                                                <span className="truncate">{act.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </td>
                        );
                    })}
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
