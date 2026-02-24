import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutGrid, Minimize, Maximize, Tv, Calendar as CalendarIcon, X, Check, FileText, Loader2, Save, Printer, Plus, Minus, AlertCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { WorkOrderTable } from './components/WorkOrderTable';
import { SettingsView } from './components/SettingsView';
import { StatisticsView } from './components/StatisticsView';
import { WorkerManager } from './components/WorkerManager';
import { TeamSchedule } from './components/TeamSchedule';
import { WerkplaatsView } from './components/WerkplaatsView';
import { SubcontractorDirectory } from './components/SubcontractorDirectory';
import { AddOrderModal } from './components/AddOrderModal'; 
import { SetupWizard } from './components/SetupWizard';
import { WorkOrder, WorkerAvailability, GlobalDay, TaskColors, CompanySettings, WorkLog, GlobalDayType, Language, OrderStatus, Subcontractor, RecurringAbsence, WorkerContact } from './types';
import * as SupabaseAPI from './supabaseAPI';

// Default Task Colors
const initialTaskColors: TaskColors = {
  kbw: '#fef9c3',
  plw: '#dbeafe',
  montage: '#fee2e2',
  werkvoorbereid: '#ffedd5',
  holiday: '#dcfce7',
  adv: '#e9d5ff'
};

// DIZIONARIO TRADUZIONI SEMPLIFICATO
const TRANSLATIONS = {
  nl: {
    dashboardTitle: 'Planning Overzicht',
    archiveTitle: 'Order Archief',
        show_completed: 'Toon Voltooide',
    dayConfig: 'Dag Configureren',
    selectStatus: 'Selecteer status voor:',
    markHoliday: 'Markeer als Feestdag',
    markAdv: 'Markeer als ADV Dag',
    resetDay: 'Reset naar Normale Werkdag',
    fullScreen: 'Volledig Scherm (Verberg Zijbalk)',
    tvMode: 'Open in Nieuw Venster (TV Mode)',
    save: 'Opslaan',
    saved: 'Gegevens Opgeslagen!',
    printReportTitle: 'Rapport Dagelijks Uren',
    printDept: 'Afdeling',
    printActivity: 'Activiteit',
    printHours: 'Uren',
    printWorker: 'Werknemer',
    printTotalHours: 'Totaal Uren Ingelogd',
    printGenerated: 'Gegenereerd'
  },
  en: {
    dashboardTitle: 'Planning Overview',
    archiveTitle: 'Order Archive',
        show_completed: 'Show Completed',
    dayConfig: 'Configure Day',
    selectStatus: 'Select status for:',
    markHoliday: 'Mark as Holiday',
    markAdv: 'Mark as ADV Day',
    resetDay: 'Reset to Normal Workday',
    fullScreen: 'Full Screen (Hide Sidebar)',
    tvMode: 'Open in New Window (TV Mode)',
    save: 'Save',
    saved: 'Data Saved!',
    printReportTitle: 'Daily Hours Report',
    printDept: 'Department',
    printActivity: 'Activity',
    printHours: 'Hours',
    printWorker: 'Worker',
    printTotalHours: 'Total Logged Hours',
    printGenerated: 'Generated'
  },
  it: {
    dashboardTitle: 'Panoramica Planning',
    archiveTitle: 'Archivio Ordini',
        show_completed: 'Mostra completati',
    dayConfig: 'Configura Giorno',
    selectStatus: 'Seleziona stato per:',
    markHoliday: 'Segna come Festivo',
    markAdv: 'Segna come Giorno ADV',
    resetDay: 'Ripristina Giorno Lavorativo',
    fullScreen: 'Schermo Intero (Nascondi Sidebar)',
    tvMode: 'Apri in Nuova Finestra (TV Mode)',
    printReportTitle: 'Rapporto Ore Giornaliere',
    printDept: 'Reparto',
    printActivity: 'Attività',
    printHours: 'Ore',
    printWorker: 'Addetto',
    printTotalHours: 'Ore Totali Registrate',
    printGenerated: 'Generato',
    save: 'Salva',
    saved: 'Dati Salvati!'
  }
};

const App: React.FC = () => {
  // --- Loading State ---
  const [isLoading, setIsLoading] = useState(true);

  // --- Data State ---
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [workers, setWorkers] = useState<string[]>([]);
  const [workerPasswords, setWorkerPasswords] = useState<Record<string, string>>({});
  const [availabilities, setAvailabilities] = useState<WorkerAvailability[]>([]);
  const [recurringAbsences, setRecurringAbsences] = useState<RecurringAbsence[]>([]);
  const [globalDays, setGlobalDays] = useState<GlobalDay[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  
  // --- Settings State (Null by default for White Label) ---
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const [layoutSpacing, setLayoutSpacing] = useState(10);
  const [tableFontSize, setTableFontSize] = useState(12);
  const [uiScale, setUiScale] = useState(1);
  const [uiFontSize, setUiFontSize] = useState(14);
  const [taskColors, setTaskColors] = useState<TaskColors>(initialTaskColors);
  
  // --- Language State ---
  const [currentLang, setCurrentLang] = useState<Language>('nl');

  // --- UI State ---
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rowHeightMultiplier, setRowHeightMultiplier] = useState<number>(() =>
    parseFloat(localStorage.getItem('snep_rowHeightMultiplier') || '1.0')
  );
  const [gridLineThickness, setGridLineThickness] = useState<number>(() =>
    parseFloat(localStorage.getItem('snep_gridLineThickness') || '1')
  );
  const [cardFontSizeMultiplier, setCardFontSizeMultiplier] = useState<number>(() =>
    parseFloat(localStorage.getItem('snep_cardFontSizeMultiplier') || '1.0')
  );
  const [formFontSizeMultiplier, setFormFontSizeMultiplier] = useState<number>(() =>
    parseFloat(localStorage.getItem('snep_formFontSizeMultiplier') || '1.0')
  );
  const [showRowHeightSlider, setShowRowHeightSlider] = useState(false);
    const [showCompleted, setShowCompleted] = useState<boolean>(() =>
        localStorage.getItem('snep_showCompleted') === 'true'
    );
  
  // --- Rubrica Ditte Form State ---
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubAddress, setNewSubAddress] = useState('');
  const [newSubContact, setNewSubContact] = useState('');
  
  // --- Print Planner State ---
  const [showPrintPlannerModal, setShowPrintPlannerModal] = useState(false);
  const [printSize, setPrintSize] = useState<'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'custom'>('A1');
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [customWidth, setCustomWidth] = useState(841); // A1 default
  const [customHeight, setCustomHeight] = useState(1189); // A1 default
  
  // --- Login State ---
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(() => localStorage.getItem('snep_currentAdmin'));
  const [showLoginModal, setShowLoginModal] = useState(!localStorage.getItem('snep_currentAdmin'));
  
  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('snep_currentAdmin', currentAdmin);
    } else {
      localStorage.removeItem('snep_currentAdmin');
    }
  }, [currentAdmin]);
  
  // TEMA GLOBALE v2.3.1
  const [theme, setTheme] = useState<'gold' | 'space' | 'space-light'>(() => 
    (localStorage.getItem('snep_theme') as 'gold' | 'space' | 'space-light') || 'space'
  );

  useEffect(() => {
      localStorage.setItem('snep_theme', theme);
  }, [theme]);

  useEffect(() => {
      localStorage.setItem('snep_showCompleted', showCompleted ? 'true' : 'false');
  }, [showCompleted]);

  useEffect(() => {
      localStorage.setItem('snep_rowHeightMultiplier', rowHeightMultiplier.toString());
  }, [rowHeightMultiplier]);

  useEffect(() => {
      localStorage.setItem('snep_gridLineThickness', gridLineThickness.toString());
  }, [gridLineThickness]);

  useEffect(() => {
      localStorage.setItem('snep_cardFontSizeMultiplier', cardFontSizeMultiplier.toString());
  }, [cardFontSizeMultiplier]);

  useEffect(() => {
      localStorage.setItem('snep_formFontSizeMultiplier', formFontSizeMultiplier.toString());
  }, [formFontSizeMultiplier]);
  
  // NEW: Save Feedback State
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // NEW: Modal State
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<WorkOrder | null>(null);
  
  // NEW: Day Config State
  const [selectedDayConfig, setSelectedDayConfig] = useState<string | null>(null);
  
  // --- AUTO-SYNC State ---
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper Translation
  const t = TRANSLATIONS[currentLang];

  // --- Data Fetching (Supabase) ---
  const fetchData = async () => {
    try {
      const data = await SupabaseAPI.fetchAllData();
      setOrders(data.orders || []);
      console.log('✅ Orders loaded from Supabase:', data.orders?.length || 0);
      console.log('📊 First 3 orders:', data.orders?.slice(0, 3).map(o => ({ 
        orderNumber: o.orderNumber, 
        status: o.status,
        scheduledDate: o.scheduledDate 
      })));
      
      setWorkers(data.workers || []);
      setWorkerPasswords(data.workerPasswords || {});
      setAvailabilities(data.availabilities || []);
      setRecurringAbsences(data.recurringAbsences || []);
      setGlobalDays(data.globalDays || []); 
      setWorkLogs(data.workLogs || []);
      
      // Load Settings - workerContacts già inclusi da fetchAllData
      if (data.settings && data.settings.name) {
         setCompanySettings(data.settings);
         localStorage.setItem('snep_settings', JSON.stringify(data.settings));
         if (data.settings.taskColors) setTaskColors(data.settings.taskColors);
      }
      console.log('✅ Data loaded from Supabase');
    } catch (e) {
      console.error("Error fetching data from Supabase", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Check LocalStorage FIRST for instant load (Skip Wizard)
    const localSettings = localStorage.getItem('snep_settings');
    if (localSettings) {
        try {
            const parsed = JSON.parse(localSettings);
            setCompanySettings(parsed);
            if (parsed.taskColors) setTaskColors(parsed.taskColors);
        } catch (e) {
            console.error("Error parsing local settings", e);
        }
    }
    // 2. Fetch fresh data from server
    fetchData();
  }, []);

  // --- REF FOR AUTO-SAVE & SYNC (Avoid Stale Closures) ---
  const stateRef = useRef({ orders, workers, workerPasswords, availabilities, globalDays, workLogs, companySettings, taskColors });

  // Update ref whenever state changes
  useEffect(() => {
      stateRef.current = { orders, workers, workerPasswords, availabilities, globalDays, workLogs, companySettings, taskColors };
  }, [orders, workers, workerPasswords, availabilities, globalDays, workLogs, companySettings, taskColors]);

  // --- AUTO-SYNC Function (Supabase) ---
  const syncDataIncremental = async () => {
    try {
      setIsSyncing(true);
      const serverData = await SupabaseAPI.fetchAllData();

      const current = stateRef.current;
      const serverOrders: WorkOrder[] = serverData.orders || [];
      const serverWorkers: string[] = serverData.workers || [];
      const serverAvailabilities = serverData.availabilities || [];
      const serverWorkLogs = serverData.workLogs || [];
      const serverWorkerPasswords = serverData.workerPasswords || {};

      if (JSON.stringify(serverOrders) !== JSON.stringify(current.orders)) {
        setOrders(serverOrders);
        setLastSyncTime(Date.now());
        console.log('🔄 Ordini aggiornati da Supabase');
      }
      if (JSON.stringify(serverWorkers) !== JSON.stringify(current.workers)) {
        setWorkers(serverWorkers);
        console.log('🔄 Dipendenti aggiornati da Supabase');
      }
      if (JSON.stringify(serverAvailabilities) !== JSON.stringify(current.availabilities)) {
        setAvailabilities(serverAvailabilities);
        console.log('🔄 Disponibilità aggiornate da Supabase');
      }
      if (JSON.stringify(serverWorkLogs) !== JSON.stringify(current.workLogs)) {
        setWorkLogs(serverWorkLogs);
        console.log('🔄 Ore aggiornate da Supabase');
      }
      if (JSON.stringify(serverWorkerPasswords) !== JSON.stringify(current.workerPasswords)) {
        setWorkerPasswords(serverWorkerPasswords);
        console.log('🔄 Password aggiornate da Supabase');
      }
      // Merge workerContacts (già inclusi in serverData.settings da fetchAllData)
      if (serverData.settings) {
        const serverSettingsStr = JSON.stringify(serverData.settings);
        const currentSettingsStr = JSON.stringify(current.companySettings);
        if (serverSettingsStr !== currentSettingsStr) {
          setCompanySettings(serverData.settings);
          if (serverData.settings.taskColors) setTaskColors(serverData.settings.taskColors);
          console.log('🔄 Impostazioni aggiornate da Supabase');
        }
      }
    } catch (e) {
      console.error('❌ Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- AUTO-SYNC TIMER (Every 4 seconds, stable interval) ---
  useEffect(() => {
    const syncInterval = setInterval(() => {
      syncDataIncremental();
    }, 4000);

    return () => clearInterval(syncInterval);
  }, []); // ← dependency array VUOTO: il timer resta attivo per tutta la vita dell'app

  // --- AUTO-SAVE TIMER (Every 30 mins) to Supabase ---
  useEffect(() => {
      const timer = setInterval(async () => {
          if (stateRef.current.companySettings) {
              console.log("⏳ Auto-saving data to Supabase...");
              try {
                  await SupabaseAPI.saveAllData({
                      orders: stateRef.current.orders,
                      workers: stateRef.current.workers,
                      workerPasswords: stateRef.current.workerPasswords,
                      availabilities: stateRef.current.availabilities,
                      globalDays: stateRef.current.globalDays,
                      workLogs: stateRef.current.workLogs,
                      settings: stateRef.current.companySettings
                  });
                  console.log("✅ Auto-save complete (Supabase)");
              } catch (e) {
                  console.error("❌ Auto-save failed", e);
              }
          }
      }, 30 * 60 * 1000);

      return () => clearInterval(timer);
  }, []);

  const saveData = async (updatedData: any) => {
      try {
          const currentSettings = updatedData.settings || (companySettings ? { ...companySettings, taskColors } : null);
          
          if (!currentSettings) return; 

          await SupabaseAPI.saveAllData({
              orders: updatedData.orders || orders,
              workers: updatedData.workers || workers,
              workerPasswords: updatedData.workerPasswords || workerPasswords,
              availabilities: updatedData.availabilities || availabilities,
              globalDays: updatedData.globalDays || globalDays, 
              workLogs: updatedData.workLogs || workLogs,
              settings: currentSettings
          });
          console.log('💾 Data saved to Supabase');
      } catch (e) {
          console.error("Error saving to Supabase", e);
      }
  };

  // --- Handlers ---
  
  // Quick Save Button Handler
  const handleQuickSave = async () => {
      await saveData({}); // Saves current state via the saveData logic
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  // First Time Setup Handler
  const handleSetupComplete = (settings: CompanySettings) => {
      // Apply default colors if none provided
      const completeSettings = { ...settings, taskColors: initialTaskColors };
      setCompanySettings(completeSettings);
      setTaskColors(initialTaskColors);
      
      // Save to localStorage immediately for next reload
      localStorage.setItem('snep_settings', JSON.stringify(completeSettings));
      
      // Save to server
      saveData({ settings: completeSettings });
  };

  const handleInlineUpdate = async (id: string, field: string, value: any) => {
      const updatedOrders = orders.map(o => o.id === id ? { ...o, [field]: value } : o);
      setOrders(updatedOrders);
      const orderToUpdate = updatedOrders.find(o => o.id === id);
      if (orderToUpdate) {
          await SupabaseAPI.saveOrder(orderToUpdate);
      }
      saveData({ orders: updatedOrders });
  };

  const handleAddOrderClick = () => {
      setSelectedOrderForEdit(null); // Clear any selection
      setIsAddOrderModalOpen(true);
  };

  const handleEditOrderClick = (order: WorkOrder) => {
      setSelectedOrderForEdit(order);
      setIsAddOrderModalOpen(true);
  };

  // Unified Save/Update Handler
  const handleSaveOrder = async (order: WorkOrder) => {
      let updatedOrders;
      // Check if updating an existing order
      const existingIndex = orders.findIndex(o => o.id === order.id);
      
      if (existingIndex >= 0) {
          // Update
          updatedOrders = [...orders];
          updatedOrders[existingIndex] = order;
      } else {
          // Create New
          updatedOrders = [...orders, order];
      }
      
      setOrders(updatedOrders);
      await SupabaseAPI.saveOrder(order);
      saveData({ orders: updatedOrders });
      setIsAddOrderModalOpen(false);
      setSelectedOrderForEdit(null);
  };

  const handleWorkerUpdate = (oldName: string, newName: string) => {
      const updatedWorkers = workers.map(w => w === oldName ? newName : w);
      setWorkers(updatedWorkers);
      saveData({ workers: updatedWorkers });
  };

  const handleWorkerAdd = async (name: string, password?: string) => {
      const updatedWorkers = [...workers, name];
      setWorkers(updatedWorkers);
      
      // Save password if provided
      if (password) {
          const updatedPasswords = { ...workerPasswords, [name]: password };
          setWorkerPasswords(updatedPasswords);
          await SupabaseAPI.saveWorker(name, password);
          saveData({ workers: updatedWorkers, workerPasswords: updatedPasswords });
      } else {
          await SupabaseAPI.saveWorker(name);
          saveData({ workers: updatedWorkers });
      }
  };

  const handleUpdatePassword = async (worker: string, password: string) => {
      const updatedPasswords = { ...workerPasswords, [worker]: password };
      setWorkerPasswords(updatedPasswords);
      await SupabaseAPI.updateWorkerPassword(worker, password);
      saveData({ workerPasswords: updatedPasswords });
  };

  const handleWorkerDelete = async (name: string) => {
      const updatedWorkers = workers.filter(w => w !== name);
      setWorkers(updatedWorkers);
      await SupabaseAPI.deleteWorker(name);
      saveData({ workers: updatedWorkers });
  };

  const handleUpdateContacts = async (contacts: Record<string, WorkerContact>) => {
            if (!companySettings) return;
            const updated = { ...companySettings, workerContacts: contacts };
            setCompanySettings(updated);
            // Salva i contatti anche nella tabella workers
            for (const [name, contactData] of Object.entries(contacts)) {
                await SupabaseAPI.saveWorker(name, workerPasswords[name] || undefined, contactData);
            }
            await SupabaseAPI.saveCompanySettings(updated);
            saveData({ settings: updated });

            // Ricarica i dati aggiornati da Supabase per evitare desincronizzazioni
            const workersData = await SupabaseAPI.fetchAllWorkers();
            setWorkers(workersData.workers || []);
            setWorkerPasswords(workersData.workerPasswords || {});
            setCompanySettings(prev => prev ? { ...prev, workerContacts: workersData.workerContacts } : prev);
  };

  const handleOpenTvWindow = () => {
      window.open(window.location.href, '_blank', 'popup=yes');
  };
  
  // --- Day Config Handlers ---
  const handleDateClick = (date: string) => {
      setSelectedDayConfig(date);
  };

  const handleUpdateDayStatus = (type: GlobalDayType | null) => {
      if (!selectedDayConfig) return;
      
      let newDays = [...globalDays];
      newDays = newDays.filter(d => d.date !== selectedDayConfig);
      
      if (type) {
          newDays.push({ date: selectedDayConfig, type });
      }
      
      setGlobalDays(newDays);
      saveData({ globalDays: newDays });
      setSelectedDayConfig(null);
  };

  // --- HANDLERS SETTINGS ---

  // Elimina tutti gli ordini completati
  const handleDeleteCompleted = async () => {
    const completed = orders.filter(o => o.status === OrderStatus.COMPLETED);
    for (const o of completed) {
      await SupabaseAPI.deleteOrder(o.id);
    }
    const remaining = orders.filter(o => o.status !== OrderStatus.COMPLETED);
    setOrders(remaining);
    saveData({ orders: remaining });
  };

  // Download backup JSON
  const handleBackup = async () => {
    const data = await SupabaseAPI.fetchAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `snep_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Ripristina backup JSON
  const handleRestore = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data) return;
    if (data.orders) {
      for (const o of data.orders) await SupabaseAPI.saveOrder(o);
      setOrders(data.orders);
    }
    if (data.settings) {
      await SupabaseAPI.saveCompanySettings(data.settings);
      setCompanySettings(data.settings);
    }
    if (data.workers) {
      for (const w of data.workers) await SupabaseAPI.saveWorker(w);
      setWorkers(data.workers);
    }
    alert('Backup ripristinato con successo!');
  };

  // Riavvia setup wizard
  const handleTriggerWizard = () => {
    localStorage.removeItem('snep_settings');
    setCompanySettings(null);
  };

  // Reset totale database
  const handleTotalReset = async () => {
    if (!window.confirm('ATTENZIONE: Questo cancellerà TUTTI i dati. Continuare?')) return;
    await SupabaseAPI.deleteAllData();
    localStorage.clear();
    window.location.reload();
  };

  // Derived state
  const sortedOrders = [...orders].sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

  // Allow a simplified mobile entrypoint via QR (e.g. http://host:port/?view=mobile)
  const urlView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
  
  // DEBUG: Log URL routing decisions
  if (typeof window !== 'undefined' && urlView) {
    console.log('🔍 DEBUG App.tsx: urlView =', urlView, 'companySettings =', companySettings ? 'loaded' : 'null', 'workers =', workers.length);
  }

  const handleSaveWorkLog = (log: WorkLog) => {
      const updated = orders.map(o => o.id === log.orderId ? { ...o, timeLogs: [...(o.timeLogs || []), log] } : o);
      setOrders(updated);
      saveData({ orders: updated });
  };

  const handleSaveOrderPhoto = (orderId: string, photoBase64: string) => {
      const updated = orders.map(o => o.id === orderId ? { ...o, photos: [...(o.photos || []), photoBase64] } : o);
      setOrders(updated);
      saveData({ orders: updated });
  };

  // Print Daily Hours Report
  const handlePrintDailyReport = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Helper function to get recurring absences for today
    const getAbsencesForToday = () => {
      const result: Record<string, string[]> = {};
      const targetDate = new Date(today);
      const targetDayOfWeek = targetDate.getDay();

      recurringAbsences.forEach(ra => {
        if (ra.dayOfWeek === targetDayOfWeek) {
          const startDate = new Date(ra.startDate);
          const daysElapsed = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksElapsed = Math.floor(daysElapsed / 7);

          if (daysElapsed >= 0 && weeksElapsed < ra.numberOfWeeks) {
            if (!result[ra.worker]) result[ra.worker] = [];
            let absenceStr = currentLang === 'it' 
              ? (ra.type === 'SICK' ? 'Malato' : ra.type === 'VACATION' ? 'Vacanza' : 'Assente')
              : currentLang === 'en'
              ? (ra.type === 'SICK' ? 'Sick' : ra.type === 'VACATION' ? 'Vacation' : 'Absent')
              : (ra.type === 'SICK' ? 'Ziek' : ra.type === 'VACATION' ? 'Vakantie' : 'Afwezig');
            
            if (ra.timeOfDay !== 'ALL_DAY') {
              absenceStr += currentLang === 'it' 
                ? (ra.timeOfDay === 'MORNING' ? ' (mattina)' : ' (pomeriggio)')
                : currentLang === 'en'
                ? (ra.timeOfDay === 'MORNING' ? ' (morning)' : ' (afternoon)')
                : (ra.timeOfDay === 'MORNING' ? ' (ochtend)' : ' (middag)');
            }
            result[ra.worker].push(absenceStr);
          }
        }
      });

      return result;
    };

    const absencesForToday = getAbsencesForToday();
    
    // Collect all order data with logs from today
    const reportData = orders
      .map((order) => {
        const todayLogs = (order.timeLogs || []).filter((log: any) => log.date === today);
        if (todayLogs.length === 0) return null;
        return { order, logs: todayLogs };
      })
      .filter(Boolean);

    // Group by worker
    const workerSummary: Record<string, {category: string; activity: string; hours: number}[]> = {};
    let totalHours = 0;

    reportData.forEach((item: any) => {
      item.logs.forEach((log: any) => {
        if (!workerSummary[log.worker]) workerSummary[log.worker] = [];
        workerSummary[log.worker].push({
          category: log.category || 'N/A',
          activity: log.activity || 'N/A',
          hours: log.hours
        });
        totalHours += log.hours;
      });
    });

    // Create HTML for printing with language-aware strings
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (!printWindow) return;

    // Language-specific date formatting
    const dateLocale = currentLang === 'en' ? 'en-GB' : currentLang === 'it' ? 'it-IT' : 'nl-NL';
    const formattedDate = new Date(today).toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get all workers (from both logs and absences)
    const allWorkers = new Set([...Object.keys(workerSummary), ...Object.keys(absencesForToday)]);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t.printReportTitle} ${today}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background: white; }
          @page { size: A4 portrait; margin: 10mm; }
          @media print {
            body { margin: 0; padding: 10mm; }
            h1 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
          }
          h1 { font-size: 24px; margin-bottom: 20px; color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .report-section { margin-bottom: 20px; }
          .worker-name { font-size: 14px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #222; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
          th { background: #f5f5f5; border: 1px solid #ddd; padding: 6px; text-align: left; font-weight: bold; }
          td { border: 1px solid #ddd; padding: 6px; }
          .total { font-weight: bold; background: #e8f0ff; }
          .absence-section { margin-top: 10px; padding: 10px; background: #fff3cd; border-left: 3px solid #ffc107; }
          .absence-box { margin: 3px 0; font-size: 10px; }
          .footer { text-align: center; color: #999; font-size: 10px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>📋 ${t.printReportTitle} - ${formattedDate}</h1>
        
        ${Array.from(allWorkers).map((worker: any) => {
          const entries = workerSummary[worker] || [];
          const absences = absencesForToday[worker] || [];
          
          return `
            <div class="worker-name">👤 ${t.printWorker}: ${worker}</div>
            
            ${entries.length > 0 ? `
              <table>
                <tr>
                  <th>${t.printDept}</th>
                  <th>${t.printActivity}</th>
                  <th>${t.printHours}</th>
                </tr>
                ${entries.map((e: any) => `
                  <tr>
                    <td>${e.category}</td>
                    <td>${e.activity}</td>
                    <td>${e.hours}</td>
                  </tr>
                `).join('')}
              </table>
            ` : `<p style="color: #999; font-style: italic;">${currentLang === 'it' ? 'Nessuna ora registrata' : currentLang === 'en' ? 'No hours logged' : 'Geen geregistreerde uren'}</p>`}
            
            ${absences.length > 0 ? `
              <div class="absence-section">
                <strong>${currentLang === 'it' ? '⚠️ Assenze' : currentLang === 'en' ? '⚠️ Absences' : '⚠️ Afwezigheden'}:</strong>
                ${absences.map((absence: string) => `<div class="absence-box">• ${absence}</div>`).join('')}
              </div>
            ` : ''}
          `;
        }).join('')}
        
        <div class="total">⏱️ ${t.printTotalHours}: ${totalHours} ${t.printHours}</div>
        <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
          ${t.printGenerated}: ${new Date().toLocaleString(dateLocale)}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Auto-print after a short delay to ensure content is loaded
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Print Planner with Custom Sizes
  const handlePrintPlanner = () => {
    const plannerContainer = document.querySelector('[data-planner-print]');
    if (!plannerContainer) return alert(currentLang === 'it' ? 'Planner non trovato' : currentLang === 'en' ? 'Planner not found' : 'Planner niet gevonden');

    // Get dimensions based on selected size (in mm)
    let width = customWidth, height = customHeight;
    const sizePresets: Record<string, [number, number]> = {
      'A4': [210, 297],
      'A3': [297, 420],
      'A2': [420, 594],
      'A1': [594, 841],
      'A0': [841, 1189]
    };

    if (printSize !== 'custom' && sizePresets[printSize]) {
      [width, height] = sizePresets[printSize];
    }

    // Swap if landscape
    if (printOrientation === 'landscape' && width < height) {
      [width, height] = [height, width];
    }

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    // Clone the planner element
    const clonedElement = (plannerContainer as HTMLElement).cloneNode(true) as HTMLElement;
    
    // Convert mm to pixels (assuming 96 DPI)
    const mmToPx = (mm: number) => (mm * 96) / 25.4;
    const pxWidth = mmToPx(width);
    const pxHeight = mmToPx(height);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${currentLang === 'it' ? 'Piano Ordini' : currentLang === 'en' ? 'Order Planner' : 'Order Planning'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: white; }
          @page { size: ${width}mm ${height}mm; margin: 5mm; }
          @media print {
            body { margin: 0; padding: 5mm; }
            .planner-page { page-break-after: always; }
          }
          .planner-page {
            width: ${pxWidth}px;
            height: ${pxHeight}px;
            border: 1px solid #ccc;
            overflow: auto;
            padding: 10px;
            transform: scale(0.9);
            transform-origin: top left;
          }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: center; }
          th { background: #f0f0f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="planner-page">
          ${clonedElement.innerHTML}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 1000);
    setShowPrintPlannerModal(false);
  };

  // --- View Rendering ---
  const renderContent = () => {
      // Safe check, though should only render if companySettings is present
      if (!companySettings) return null;

      // HARDCODED CONSTANTS FOR COMPACT LAYOUT (V6.6.42)
      const FIXED_ROW_HEIGHT = 24;
      const FIXED_HEADER_HEIGHT = 40;
      const FIXED_DAY_WIDTH = 60;
      const FIXED_CARD_FONT = 14;

      switch (currentView) {
          case 'dashboard': {
              const plannerOrders = showCompleted ? sortedOrders : sortedOrders.filter(o => o.status !== OrderStatus.COMPLETED);
              console.log('📊 Dashboard filter: showCompleted =', showCompleted, 
                          '| Total orders:', sortedOrders.length, 
                          '| Filtered orders:', plannerOrders.length);
              const effectiveRowHeight = Math.round(FIXED_ROW_HEIGHT * rowHeightMultiplier);
              const effectiveCardFontSize = Math.round(FIXED_CARD_FONT * cardFontSizeMultiplier);
              return (
                  <div className="absolute inset-0 w-full h-full flex flex-col p-2">
                      {/* Toggle Slider Button & Slider Container */}
                      <div className="flex flex-col gap-2 mb-2">
                          {/* Toggle Button */}
                          <button
                              onClick={() => setShowRowHeightSlider(!showRowHeightSlider)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                  theme === 'gold'
                                      ? showRowHeightSlider
                                          ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40'
                                          : 'bg-[#1a1a1a]/50 text-[#d4af37]/60 border border-[#d4af37]/20 hover:bg-[#d4af37]/10'
                                      : showRowHeightSlider
                                          ? 'bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/40'
                                          : 'bg-[#0f172a]/50 text-[#00f2fe]/60 border border-[#00f2fe]/20 hover:bg-[#00f2fe]/10'
                              }`}
                          >
                              {showRowHeightSlider ? 'Hide Display Settings' : 'Show Display Settings'}
                          </button>

                          {/* Display Settings - Conditional */}
                          {showRowHeightSlider && (
                              <div className={`flex flex-col gap-3 px-4 py-3 rounded-lg ${theme === 'gold' ? 'bg-[#1a1a1a]/80' : 'bg-[#0f172a]/80'} border ${theme === 'gold' ? 'border-[#d4af37]/20' : 'border-[#00f2fe]/20'}`}>
                                  
                                  {/* Row Height Slider */}
                                  <div className="flex items-center gap-3">
                                      <span className={`text-sm font-semibold w-24 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          Row Height:
                                      </span>
                                      <button 
                                          onClick={() => setRowHeightMultiplier(Math.max(0.6, rowHeightMultiplier - 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Decrease row height"
                                      >
                                          <Minus size={18} />
                                      </button>
                                      <input 
                                          type="range" 
                                          min="0.6" 
                                          max="4.0" 
                                          step="0.1" 
                                          value={rowHeightMultiplier}
                                          onChange={(e) => setRowHeightMultiplier(parseFloat(e.target.value))}
                                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                          style={{
                                              background: theme === 'gold' 
                                                  ? `linear-gradient(to right, #d4af37 0%, #d4af37 ${(rowHeightMultiplier - 0.6) / 3.4 * 100}%, #444 ${(rowHeightMultiplier - 0.6) / 3.4 * 100}%, #444 100%)`
                                                  : `linear-gradient(to right, #00f2fe 0%, #00f2fe ${(rowHeightMultiplier - 0.6) / 3.4 * 100}%, #444 ${(rowHeightMultiplier - 0.6) / 3.4 * 100}%, #444 100%)`
                                          }}
                                      />
                                      <button 
                                          onClick={() => setRowHeightMultiplier(Math.min(4.0, rowHeightMultiplier + 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Increase row height"
                                      >
                                          <Plus size={18} />
                                      </button>
                                      <span className={`text-sm font-mono w-12 text-right ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          {rowHeightMultiplier.toFixed(1)}x
                                      </span>
                                      <span className={`text-xs ${theme === 'gold' ? 'text-[#d4af37]/60' : 'text-[#00f2fe]/60'}`}>
                                          ({effectiveRowHeight}px)
                                      </span>
                                  </div>

                                  {/* Grid Line Thickness Slider */}
                                  <div className="flex items-center gap-3">
                                      <span className={`text-sm font-semibold w-24 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          Line Thickness:
                                      </span>
                                      <button 
                                          onClick={() => setGridLineThickness(Math.max(1, gridLineThickness - 1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Decrease line thickness"
                                      >
                                          <Minus size={18} />
                                      </button>
                                      <input 
                                          type="range" 
                                          min="1" 
                                          max="8" 
                                          step="1" 
                                          value={gridLineThickness}
                                          onChange={(e) => setGridLineThickness(parseFloat(e.target.value))}
                                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                          style={{
                                              background: theme === 'gold' 
                                                  ? `linear-gradient(to right, #d4af37 0%, #d4af37 ${(gridLineThickness - 1) / 7 * 100}%, #444 ${(gridLineThickness - 1) / 7 * 100}%, #444 100%)`
                                                  : `linear-gradient(to right, #00f2fe 0%, #00f2fe ${(gridLineThickness - 1) / 7 * 100}%, #444 ${(gridLineThickness - 1) / 7 * 100}%, #444 100%)`
                                          }}
                                      />
                                      <button 
                                          onClick={() => setGridLineThickness(Math.min(8, gridLineThickness + 1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Increase line thickness"
                                      >
                                          <Plus size={18} />
                                      </button>
                                      <span className={`text-sm font-mono w-12 text-right ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          {gridLineThickness}px
                                      </span>
                                  </div>

                                  {/* Font Size Slider */}
                                  <div className="flex items-center gap-3">
                                      <span className={`text-sm font-semibold w-24 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          Font Size:
                                      </span>
                                      <button 
                                          onClick={() => setCardFontSizeMultiplier(Math.max(0.5, cardFontSizeMultiplier - 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Decrease font size"
                                      >
                                          <Minus size={18} />
                                      </button>
                                      <input 
                                          type="range" 
                                          min="0.5" 
                                          max="2.0" 
                                          step="0.1" 
                                          value={cardFontSizeMultiplier}
                                          onChange={(e) => setCardFontSizeMultiplier(parseFloat(e.target.value))}
                                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                          style={{
                                              background: theme === 'gold' 
                                                  ? `linear-gradient(to right, #d4af37 0%, #d4af37 ${(cardFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 ${(cardFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 100%)`
                                                  : `linear-gradient(to right, #00f2fe 0%, #00f2fe ${(cardFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 ${(cardFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 100%)`
                                          }}
                                      />
                                      <button 
                                          onClick={() => setCardFontSizeMultiplier(Math.min(2.0, cardFontSizeMultiplier + 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Increase font size"
                                      >
                                          <Plus size={18} />
                                      </button>
                                      <span className={`text-sm font-mono w-12 text-right ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          {cardFontSizeMultiplier.toFixed(1)}x
                                      </span>
                                      <span className={`text-xs ${theme === 'gold' ? 'text-[#d4af37]/60' : 'text-[#00f2fe]/60'}`}>
                                          ({effectiveCardFontSize}px)
                                      </span>
                                  </div>

                                  {/* Form Font Size Slider */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`text-xs font-mono flex-shrink-0 ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          Form Size:
                                      </span>
                                      <button 
                                          onClick={() => setFormFontSizeMultiplier(Math.max(0.5, formFontSizeMultiplier - 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Decrease form font size"
                                      >
                                          <Minus size={18} />
                                      </button>
                                      <input 
                                          type="range" 
                                          min="0.5" 
                                          max="2.0" 
                                          step="0.1" 
                                          value={formFontSizeMultiplier}
                                          onChange={(e) => setFormFontSizeMultiplier(parseFloat(e.target.value))}
                                          className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                          style={{
                                              background: theme === 'gold' 
                                                  ? `linear-gradient(to right, #d4af37 0%, #d4af37 ${(formFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 ${(formFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 100%)`
                                                  : `linear-gradient(to right, #00f2fe 0%, #00f2fe ${(formFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 ${(formFontSizeMultiplier - 0.5) / 1.5 * 100}%, #444 100%)`
                                          }}
                                      />
                                      <button 
                                          onClick={() => setFormFontSizeMultiplier(Math.min(2.0, formFontSizeMultiplier + 0.1))}
                                          className={`p-1 rounded hover:bg-white/10 transition-colors ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}
                                          title="Increase form font size"
                                      >
                                          <Plus size={18} />
                                      </button>
                                      <span className={`text-sm font-mono w-12 text-right ${theme === 'gold' ? 'text-[#d4af37]' : 'text-[#00f2fe]'}`}>
                                          {formFontSizeMultiplier.toFixed(1)}x
                                      </span>
                                      <span className={`text-xs ${theme === 'gold' ? 'text-[#d4af37]/60' : 'text-[#00f2fe]/60'}`}>
                                          ({Math.round(14 * formFontSizeMultiplier)}px)
                                      </span>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Table Container */}
                      <div className={`flex-1 overflow-hidden w-full h-full ${theme === 'gold' ? 'bg-[#111]' : 'bg-[#0f172a]'} backdrop-blur-xl rounded-[1.5rem] overflow-hidden border ${theme === 'gold' ? 'border-[#d4af37]/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'border-[#00f2fe]/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)]'}`} data-planner-print>
                          <WorkOrderTable 
                              orders={plannerOrders}
                              availabilities={availabilities}
                              recurringAbsences={recurringAbsences}
                              onDateClick={handleDateClick}
                              onOrderClick={handleEditOrderClick}
                              onInlineUpdate={handleInlineUpdate}
                              viewMode="calendar"
                              baseFontSize={tableFontSize}
                              layoutSpacing={layoutSpacing}
                              taskColors={taskColors}
                              globalDays={globalDays}
                              rowHeight={effectiveRowHeight}
                              isAutoHeight={true}
                              dayColWidth={FIXED_DAY_WIDTH}
                              headerHeight={FIXED_HEADER_HEIGHT}
                              cardFontSize={effectiveCardFontSize}
                              gridLineThickness={gridLineThickness}
                              language={currentLang}
                          />
                      </div>
                  </div>
              );
          }
          case 'archief': {
              const completedOrders = sortedOrders.filter(o => o.status === OrderStatus.COMPLETED);
              const effectiveRowHeight = Math.round(FIXED_ROW_HEIGHT * rowHeightMultiplier);
              const effectiveCardFontSize = Math.round(FIXED_CARD_FONT * cardFontSizeMultiplier);
              return (
                  <div className="absolute inset-0 w-full h-full p-2">
                      <div className={`w-full h-full ${theme === 'gold' ? 'bg-[#111]' : 'bg-[#0f172a]'} backdrop-blur-xl rounded-[1.5rem] overflow-hidden border ${theme === 'gold' ? 'border-[#d4af37]/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : 'border-[#00f2fe]/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)]'}`}>
                          <WorkOrderTable 
                              orders={completedOrders}
                              availabilities={availabilities}
                              recurringAbsences={recurringAbsences}
                              onDateClick={() => {}}
                              onOrderClick={handleEditOrderClick}
                              onInlineUpdate={handleInlineUpdate}
                              viewMode="list"
                              baseFontSize={tableFontSize}
                              layoutSpacing={layoutSpacing}
                              taskColors={taskColors}
                              globalDays={globalDays}
                              rowHeight={effectiveRowHeight}
                              isAutoHeight={true}
                              dayColWidth={FIXED_DAY_WIDTH}
                              headerHeight={FIXED_HEADER_HEIGHT}
                              cardFontSize={effectiveCardFontSize}
                              gridLineThickness={gridLineThickness}
                              language={currentLang}
                          />
                      </div>
                  </div>
              );
          }
          case 'employees':
              return (
                  <div className="p-8 h-full overflow-y-auto">
                      <WorkerManager 
                          workers={workers}
                          workerPasswords={workerPasswords}
                          workerContacts={companySettings?.workerContacts || {}}
                          onAdd={handleWorkerAdd}
                          onUpdate={handleWorkerUpdate}
                          onDelete={handleWorkerDelete}
                          onUpdatePassword={handleUpdatePassword}
                          onUpdateContacts={handleUpdateContacts}
                          language={currentLang}
                      />
                  </div>
              );
          case 'team-schedule':
              return (
                  <div className="h-full overflow-hidden p-2">
                     <TeamSchedule 
                        workers={workers} 
                        orders={orders} 
                        availabilities={availabilities}
                        recurringAbsences={recurringAbsences}
                        onAddRecurringAbsence={(absence) => {
                            const updated = [...recurringAbsences, absence];
                            setRecurringAbsences(updated);
                            saveData({ recurringAbsences: updated });
                        }}
                        onDeleteRecurringAbsence={(id) => {
                            const updated = recurringAbsences.filter(a => a.id !== id);
                            setRecurringAbsences(updated);
                            saveData({ recurringAbsences: updated });
                        }}
                        baseFontSize={uiFontSize}
                        language={currentLang}
                        gridLineThickness={gridLineThickness}
                     />
                  </div>
              );
          case 'statistics':
              return (
                  <div className="p-8 h-full overflow-y-auto">
                      <StatisticsView
                          orders={orders}
                          taskColors={taskColors}
                          language={currentLang}
                          onDeleteLog={(orderId: string, logId: string) => {
                              const updated = orders.map(o => o.id === orderId ? { ...o, timeLogs: (o.timeLogs || []).filter(l => l.id !== logId) } : o);
                              setOrders(updated);
                              saveData({ orders: updated });
                          }}
                          onUpdateLog={(orderId: string, logId: string, hours: number, note: string) => {
                              const updated = orders.map(o => o.id === orderId ? { ...o, timeLogs: (o.timeLogs || []).map(l => l.id === logId ? { ...l, hours, note } : l) } : o);
                              setOrders(updated);
                              saveData({ orders: updated });
                          }}
                          adminPassword={companySettings?.adminPassword}
                          theme={theme}
                      />
                  </div>
              );
          case 'rubrica-ditte': {
              return (
                  <SubcontractorDirectory
                      companySettings={companySettings}
                      onUpdateSettings={(updated) => {
                          setCompanySettings(updated);
                          saveData({ settings: updated });
                      }}
                      language={currentLang}
                      newSubName={newSubName}
                      setNewSubName={setNewSubName}
                      newSubEmail={newSubEmail}
                      setNewSubEmail={setNewSubEmail}
                      newSubPhone={newSubPhone}
                      setNewSubPhone={setNewSubPhone}
                      newSubAddress={newSubAddress}
                      setNewSubAddress={setNewSubAddress}
                      newSubContact={newSubContact}
                      setNewSubContact={setNewSubContact}
                  />
              );
          }
          case 'instellingen':
              return (
                  <SettingsView 
                    isOpen={true}
                    onClose={() => setCurrentView('dashboard')}
                    scale={uiScale} onScaleChange={setUiScale}
                    fontSize={uiFontSize} onFontSizeChange={setUiFontSize}
                    tableFontSize={tableFontSize} onTableFontSizeChange={setTableFontSize}
                    onDeleteCompleted={handleDeleteCompleted}
                    onBackup={handleBackup}
                    onRestore={handleRestore}
                    onTriggerWizard={handleTriggerWizard}
                    onTotalReset={handleTotalReset}
                    primaryColor="#2563eb" onPrimaryColorChange={() => {}}
                    sidebarColor="#0f172a" onSidebarColorChange={() => {}}
                    sidebarTextColor="#ffffff" onSidebarTextColorChange={() => {}}
                    sidebarWidth={264} onSidebarWidthChange={() => {}}
                    layoutSpacing={layoutSpacing} onLayoutSpacingChange={setLayoutSpacing}
                    taskColors={taskColors} onTaskColorsChange={(c) => { setTaskColors(c); saveData({ settings: { ...companySettings, taskColors: c } }); }}
                    language={currentLang} 
                    onLanguageChange={setCurrentLang}
                    theme={theme}
                    onThemeChange={setTheme}
                    workers={workers}
                    departments={companySettings?.departments || []}
                    onUpdateDepartments={(d) => {
                                                const updated = { ...companySettings, departments: d };
                                                setCompanySettings(updated);
                                                saveData({ settings: updated });
                                                // Ricarica i dipartimenti da Supabase dopo il salvataggio
                                                SupabaseAPI.fetchCompanySettings().then((settings) => {
                                                    if (settings && settings.departments) {
                                                        setCompanySettings(prev => prev ? { ...prev, departments: settings.departments } : prev);
                                                    }
                                                });
                    }}
                    subcontractors={companySettings?.subcontractors || []}
                    onAddSubcontractor={(subcontractor) => {
                                                const updated = { ...companySettings, subcontractors: [...(companySettings?.subcontractors || []), subcontractor] };
                                                setCompanySettings(updated);
                                                saveData({ settings: updated });
                                                // Ricarica le ditte partner da Supabase dopo il salvataggio
                                                SupabaseAPI.fetchCompanySettings().then((settings) => {
                                                    if (settings && settings.subcontractors) {
                                                        setCompanySettings(prev => prev ? { ...prev, subcontractors: settings.subcontractors } : prev);
                                                    }
                                                });
                    }}
                    onDeleteSubcontractor={(id) => {
                                                const updated = { ...companySettings, subcontractors: (companySettings?.subcontractors || []).filter(s => s.id !== id) };
                                                setCompanySettings(updated);
                                                saveData({ settings: updated });
                                                // Ricarica le ditte partner da Supabase dopo la cancellazione
                                                SupabaseAPI.fetchCompanySettings().then((settings) => {
                                                    if (settings && settings.subcontractors) {
                                                        setCompanySettings(prev => prev ? { ...prev, subcontractors: settings.subcontractors } : prev);
                                                    }
                                                });
                    }}
                    mobilePermissions={companySettings?.mobilePermissions || {}}
                    onUpdateMobilePermissions={(p) => {
                                                const updated = { ...companySettings, mobilePermissions: p };
                                                setCompanySettings(updated);
                                                saveData({ settings: updated });
                                                // Ricarica i permessi mobile da Supabase dopo il salvataggio
                                                SupabaseAPI.fetchCompanySettings().then((settings) => {
                                                    if (settings && settings.mobilePermissions) {
                                                        setCompanySettings(prev => prev ? { ...prev, mobilePermissions: settings.mobilePermissions } : prev);
                                                    }
                                                });
                    }}
                    companyName={companySettings?.name || ''}
                    companyLogo={companySettings?.logoUrl}
                    onUpdateCompanyDetails={(name, logo) => {
                                                const updated = { ...companySettings, name, logoUrl: logo };
                                                setCompanySettings(updated);
                                                saveData({ settings: updated });
                                                // Ricarica i dettagli azienda da Supabase dopo il salvataggio
                                                SupabaseAPI.fetchCompanySettings().then((settings) => {
                                                    if (settings && (settings.name || settings.logoUrl)) {
                                                        setCompanySettings(prev => prev ? { ...prev, name: settings.name, logoUrl: settings.logoUrl } : prev);
                                                    }
                                                });
                    }}
                    adminProfiles={companySettings?.adminProfiles || []}
                    onUpdateAdminProfiles={(profiles) => {
                        const updated = { ...companySettings, adminProfiles: profiles };
                        setCompanySettings(updated);
                        saveData({ settings: updated });
                    }}
                  />
              );
          default: 
              return null;
      }
  };

  // --- INITIAL LOADING ---
  // Only show loader if we don't have settings yet (and no local storage fallback found)
  if (isLoading && !companySettings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium text-lg">Systeem laden...</p>
        </div>
      </div>
    );
  }

    if (!companySettings) {
        return <SetupWizard onComplete={handleSetupComplete} />;
    }

  // Workshop/werkplaats view (accessible from QR code)
  if (urlView === 'werkplaats') {
      // Wait for data to load before showing workshop interface
      if (isLoading) {
          return (
              <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
                  <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-blue-600" size={48} />
                      <p className="text-gray-500 font-medium text-lg">Caricamento dati...</p>
                  </div>
              </div>
          );
      }
      console.log('✅ Rendering WerkplaatsView');
      return (
          <WerkplaatsView
              orders={orders}
              lastUpdated={new Date()}
              workers={workers}
              workerPasswords={companySettings?.workerPasswords}
              onSaveOrder={(o) => { const updated = orders.map(x => x.id === o.id ? o : x); setOrders(updated); saveData({ orders: updated }); }}
              onDeleteLog={(orderId, logId) => {
                      const updated = orders.map(o => o.id === orderId ? { ...o, timeLogs: (o.timeLogs || []).filter(l => l.id !== logId) } : o);
                      setOrders(updated);
                      saveData({ orders: updated });
              }}
              onSaveOrderPhoto={handleSaveOrderPhoto}
              language={currentLang}
              departments={companySettings?.departments}
              mobilePermissions={companySettings?.mobilePermissions}
              theme={theme === 'space-light' ? 'gold' : theme}
          />
      );
  }

  // --- MAIN APP ---
  return (
     <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
    theme === 'gold' ? 'bg-[#0a0a0a] text-gray-200' : 
    theme === 'space' ? 'bg-[#020617] text-gray-200' : 
    'bg-[#f1f5f9] text-slate-900' 
}`} style={{ fontSize: `${uiFontSize}px` }}>
      {/* AUTO-SYNC STATUS INDICATOR */}
      <div className={`fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
        isSyncing 
          ? 'bg-blue-500/20 text-blue-600 border border-blue-300'
          : 'bg-green-500/10 text-green-700 border border-green-300'
      }`}>
        {isSyncing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Sincronizzando...</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Sincronizzato</span>
          </>
        )}
      </div>

      <AddOrderModal 
         isOpen={isAddOrderModalOpen} 
         onClose={() => {
             setIsAddOrderModalOpen(false);
             setSelectedOrderForEdit(null);
         }} 
         onSave={handleSaveOrder}
         workers={workers}
         subcontractors={companySettings?.subcontractors || []}
         editingOrder={selectedOrderForEdit}
         language={currentLang}
         baseFontSize={Math.round(14 * formFontSizeMultiplier)}
      />

      {selectedDayConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-blue-600"/>
                        {t.dayConfig}
                    </h3>
                    <button onClick={() => setSelectedDayConfig(null)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-6 text-center font-medium">
                    {t.selectStatus} <br/>
                    <span className="text-lg text-gray-900 font-bold">
                        {new Date(selectedDayConfig).toLocaleDateString(currentLang === 'en' ? 'en-GB' : (currentLang === 'it' ? 'it-IT' : 'nl-NL'), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={() => handleUpdateDayStatus('HOLIDAY')}
                        className="w-full p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: taskColors.holiday, borderColor: '#bbf7d0', color: '#166534' }}
                    >
                        <span className="font-bold">{t.markHoliday}</span>
                        {globalDays.find(d => d.date === selectedDayConfig)?.type === 'HOLIDAY' && <Check size={18}/>}
                    </button>

                    <button 
                        onClick={() => handleUpdateDayStatus('ADV')}
                        className="w-full p-3 rounded-lg border flex items-center justify-between transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: taskColors.adv, borderColor: '#e9d5ff', color: '#6b21a8' }}
                    >
                        <span className="font-bold">{t.markAdv}</span>
                        {globalDays.find(d => d.date === selectedDayConfig)?.type === 'ADV' && <Check size={18}/>}
                    </button>

                    <button 
                        onClick={() => handleUpdateDayStatus(null)}
                        className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-colors mt-2"
                    >
                        {t.resetDay}
                    </button>
                </div>

                {/* ABSENCES SECTION */}
                {recurringAbsences.length > 0 && (() => {
                    const targetDate = new Date(selectedDayConfig);
                    const targetDayOfWeek = targetDate.getDay();
                    const absencesForDay = recurringAbsences.filter(ra => {
                        if (ra.dayOfWeek !== targetDayOfWeek) return false;
                        const startDate = new Date(ra.startDate);
                        const daysElapsed = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        const weeksElapsed = Math.floor(daysElapsed / 7);
                        return daysElapsed >= 0 && weeksElapsed < ra.numberOfWeeks;
                    });

                    if (absencesForDay.length === 0) return null;

                    const absenceTypeMap: Record<string, string> = {
                        'SICK': currentLang === 'it' ? '🤒 Malato' : (currentLang === 'en' ? '🤒 Sick' : '🤒 Ziek'),
                        'VACATION': currentLang === 'it' ? '🏖️ Vacanza' : (currentLang === 'en' ? '🏖️ Vacation' : '🏖️ Vakantie'),
                        'ABSENT': currentLang === 'it' ? '❌ Assente' : (currentLang === 'en' ? '❌ Absent' : '❌ Afwezig')
                    };

                    return (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <AlertCircle size={16}/> 
                                {currentLang === 'it' ? 'Assenze' : (currentLang === 'en' ? 'Absences' : 'Afwezigheden')}
                            </h4>
                            <div className="space-y-2">
                                {absencesForDay.map((abs, idx) => (
                                    <div key={idx} className="p-2 rounded bg-gray-50 border border-gray-200">
                                        <div className="font-medium text-gray-800">{abs.worker}</div>
                                        <div className="text-sm text-gray-600">
                                            {absenceTypeMap[abs.type] || abs.type}
                                            {abs.timeOfDay !== 'ALL_DAY' && (
                                                <span> ({currentLang === 'it' ? (abs.timeOfDay === 'MORNING' ? 'mattina' : 'pomeriggio') : (currentLang === 'en' ? (abs.timeOfDay === 'MORNING' ? 'morning' : 'afternoon') : (abs.timeOfDay === 'MORNING' ? 'ochtend' : 'middag'))})</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
      )}

      {/* Hide Sidebar if in full screen mode */}
      {!isFullScreen && (
        <Sidebar 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            currentView={currentView}
            onNavigate={setCurrentView}
            onAddOrder={handleAddOrderClick} 
            companySettings={companySettings}
                    currentLang={currentLang}
                    onLanguageChange={setCurrentLang}
                    theme={theme}
                    onThemeChange={setTheme}
                    currentAdmin={currentAdmin}
                    onLogout={() => {
                      setCurrentAdmin(null);
                      setShowLoginModal(true);
                    }}
        />
      )}

      <main className={`flex-1 flex flex-col h-full transition-all duration-300 ${isFullScreen ? 'ml-0' : (isSidebarCollapsed ? 'ml-20' : 'ml-[264px]')} p-2`}>
        <div className={`flex-1 transition-all duration-300 ${
    theme === 'gold' ? 'bg-[#141414]/60 border-[#d4af37]/20 shadow-[0_8px_40px_rgba(0,0,0,0.8)]' : 
    theme === 'space' ? 'bg-[#0f172a]/60 border-[#00f2fe]/20 shadow-[0_8px_40px_rgba(0,0,0,0.6)]' : 
    'bg-white/80 border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.05)]' 
} backdrop-blur-2xl border flex flex-col overflow-hidden relative ${isFullScreen ? 'rounded-none border-0' : 'rounded-t-xl'}`}>
        {(currentView === 'dashboard' || currentView === 'archief') && (
    <div 
        className={`flex items-center justify-between border-b shrink-0 transition-all duration-300 ${
            theme === 'gold' ? 'bg-[#0a0a0a]/80 border-[#d4af37]/30' : 
            theme === 'space' ? 'bg-[#020617]/80 border-[#00f2fe]/30' : 
            'bg-white/90 border-slate-200 shadow-sm'
        } backdrop-blur-md`}
        style={{ padding: `${layoutSpacing}px` }} 
    >
    <h2 className={`font-black flex items-center gap-2 transition-colors ${
        theme === 'gold' ? 'text-[#d4af37]' : 
        theme === 'space' ? 'text-white' : 
        'text-slate-800'
    }`}>
        {currentView === 'archief' ? <FileText size={18}/> : <LayoutGrid size={18}/>}
        {currentView === 'archief' ? t.archiveTitle : t.dashboardTitle}
        <span className={`ml-3 text-[10px] font-black px-2 py-0.5 rounded-full ${theme === 'gold' ? 'bg-[#d4af37] text-black' : 'bg-blue-600 text-white'}`}>v2.3.1</span>
    </h2>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2 mr-2">
                                                <input
                                                        type="checkbox"
                                                        checked={showCompleted}
                                                        onChange={(e) => setShowCompleted(e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <span className="text-xs font-bold text-gray-400 hidden sm:inline">{t.show_completed}</span>
                                        </label>
                    {/* FEEDBACK SALVATAGGIO DINAMICO */}
                    {showSaveSuccess && (
                        <span className={`text-sm font-bold animate-fade-in flex items-center gap-1 mr-2 ${
                            theme === 'space-light' ? 'text-emerald-600' : 'text-green-400'
                        }`}>
                            <Check size={16} /> {t.saved}
                        </span>
                    )}
                    
                    {/* BOTTONE SALVA DINAMICO */}
                    <button 
                        onClick={handleQuickSave}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-all font-bold text-sm shadow-sm ${
                            theme === 'gold' ? 'bg-[#d4af37] border-[#d4af37] text-black hover:bg-[#aa8c2c]' :
                            theme === 'space' ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' :
                            'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        title={t.save}
                    >
                        <Save size={16} />
                        <span className="hidden sm:inline">{t.save}</span>
                    </button>

                    {/* BOTTONE STAMPA REPORT OREN DINAMICO */}
                    <button 
                        onClick={handlePrintDailyReport}
                        className={`p-1.5 rounded-md transition-colors ${
                            theme === 'space-light' ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10'
                        }`}
                        title={currentLang === 'en' ? 'Print Daily Hours Report' : currentLang === 'it' ? 'Stampa Rapporto Ore Giornaliere' : 'Stampa Rapport Oren Odierne'}
                    >
                        <Printer size={20} />
                    </button>

                    {/* BOTTONE STAMPA PLANNER */}
                    <button 
                        onClick={() => setShowPrintPlannerModal(true)}
                        className={`p-1.5 rounded-md transition-colors ${
                            theme === 'space-light' ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10'
                        }`}
                        title={currentLang === 'en' ? 'Print Planner' : currentLang === 'it' ? 'Stampa Planner' : 'Print Planner'}
                    >
                        <FileText size={20} />
                    </button>

                    {/* BOTTONE TV DINAMICO */}
                    <button 
                        onClick={handleOpenTvWindow}
                        className={`p-1.5 rounded-md transition-colors ${
                            theme === 'space-light' ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10'
                        }`}
                        title={t.tvMode}
                    >
                        <Tv size={20} />
                    </button>

                    {/* BOTTONE FULLSCREEN DINAMICO */}
                    <button 
                        onClick={() => setIsFullScreen(!isFullScreen)} 
                        className={`p-1.5 rounded-md transition-colors ${
                            theme === 'space-light' ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10'
                        }`}
                        title={t.fullScreen}
                    >
                        {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
                </div>
            )}
            
            <div className={`flex-1 w-full relative h-full min-h-0 overflow-hidden transition-colors duration-300 ${
                theme === 'gold' ? 'bg-[#0a0a0a]/40' : 
                theme === 'space' ? 'bg-[#020617]/40' : 
                'bg-slate-50/50'
            }`}>
                {renderContent()}
            </div>

            {/* MODAL STAMPA PLANNER */}
            {showPrintPlannerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">{currentLang === 'it' ? 'Stampa Planner' : currentLang === 'en' ? 'Print Planner' : 'Print Planner'}</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">{currentLang === 'it' ? 'Orientamento' : currentLang === 'en' ? 'Orientation' : 'Oriëntatie'}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPrintOrientation('portrait')}
                                        className={`px-3 py-2 rounded font-bold transition-colors ${
                                            printOrientation === 'portrait'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {currentLang === 'it' ? '📄 Verticale' : currentLang === 'en' ? '📄 Portrait' : '📄 Staand'}
                                    </button>
                                    <button
                                        onClick={() => setPrintOrientation('landscape')}
                                        className={`px-3 py-2 rounded font-bold transition-colors ${
                                            printOrientation === 'landscape'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {currentLang === 'it' ? '📋 Orizzontale' : currentLang === 'en' ? '📋 Landscape' : '📋 Liggend'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">{currentLang === 'it' ? 'Dimensione Carta' : currentLang === 'en' ? 'Paper Size' : 'Papierformaat'}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['A4', 'A3', 'A2', 'A1', 'A0'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => { setPrintSize(size as any); setCustomWidth(0); setCustomHeight(0); }}
                                            className={`px-3 py-2 rounded font-bold transition-colors text-sm ${
                                                printSize === size
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">{currentLang === 'it' ? 'Personalizzato (mm)' : currentLang === 'en' ? 'Custom (mm)' : 'Aangepast (mm)'}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder={currentLang === 'it' ? 'Larghezza' : currentLang === 'en' ? 'Width' : 'Breedte'}
                                        value={customWidth}
                                        onChange={(e) => { setCustomWidth(parseInt(e.target.value) || 0); setPrintSize('custom'); }}
                                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <input
                                        type="number"
                                        placeholder={currentLang === 'it' ? 'Altezza' : currentLang === 'en' ? 'Height' : 'Hoogte'}
                                        value={customHeight}
                                        onChange={(e) => { setCustomHeight(parseInt(e.target.value) || 0); setPrintSize('custom'); }}
                                        className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handlePrintPlanner}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
                            >
                                {currentLang === 'it' ? '🖨️ Stampa' : currentLang === 'en' ? '🖨️ Print' : '🖨️ Print'}
                            </button>
                            <button
                                onClick={() => setShowPrintPlannerModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-bold hover:bg-gray-400 transition-colors"
                            >
                                {currentLang === 'it' ? 'Annulla' : currentLang === 'en' ? 'Cancel' : 'Annuleren'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]">
          <div className={`p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${theme === 'gold' ? 'bg-[#1a1a1a] border-[#d4af37]' : theme === 'space' ? 'bg-[#0f172a] border-[#00f2fe]' : 'bg-white border-slate-300'} border-2`}>
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'gold' ? 'text-[#d4af37]' : theme === 'space' ? 'text-[#00f2fe]' : 'text-slate-800'}`}>
              {currentLang === 'it' ? 'Seleziona Admin' : currentLang === 'en' ? 'Select Admin' : 'Selecteer Admin'}
            </h2>
            <p className="text-sm text-gray-400 mb-6">{currentLang === 'it' ? 'Scegli il tuo profilo amministratore' : currentLang === 'en' ? 'Choose your admin profile' : 'Kies je admin profiel'}</p>
            
            {(companySettings?.adminProfiles || []).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">{currentLang === 'it' ? 'Nessun admin configurato' : currentLang === 'en' ? 'No admin configured' : 'Geen admin geconfigureerd'}</p>
                <button
                  onClick={() => {
                    setCurrentAdmin('Admin');
                    setShowLoginModal(false);
                  }}
                  className={`px-6 py-3 rounded-lg font-bold transition-colors ${theme === 'gold' ? 'bg-[#d4af37] text-black hover:bg-[#aa8c2c]' : 'bg-[#00f2fe] text-black hover:bg-[#4facfe]'}`}
                >
                  {currentLang === 'it' ? 'Continua come Admin' : currentLang === 'en' ? 'Continue as Admin' : 'Verder als Admin'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(companySettings?.adminProfiles || []).map((admin: any) => (
                  <button
                    key={admin.id}
                    onClick={() => {
                      setCurrentAdmin(admin.name);
                      setShowLoginModal(false);
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left font-bold transition-all hover:scale-105 ${
                      theme === 'gold' ? 'bg-[#0a0a0a] border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37]' : 
                      theme === 'space' ? 'bg-[#020617] border-[#00f2fe]/30 hover:border-[#00f2fe] text-[#00f2fe]' :
                      'bg-white border-slate-300 hover:border-slate-500 text-slate-800'
                    }`}
                  >
                    👤 {admin.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;