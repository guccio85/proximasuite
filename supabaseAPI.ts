import { supabase } from './supabaseClient';
import { WorkOrder, CompanySettings, WorkerAvailability, RecurringAbsence, GlobalDay, WorkLog, TimeLog } from './types';

// ============================================
// WORK ORDERS
// ============================================

export const fetchAllOrders = async (): Promise<WorkOrder[]> => {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  
  // Converti da formato Supabase a formato app
  // IMPORTANTE: Se row.data è null/undefined, ricostruiamo l'oggetto dai campi delle colonne
  return (data || []).map((row: any) => {
    if (row.data && typeof row.data === 'object') {
      // Se esiste JSONB data, usalo ma assicurati di sovrascrivere con i campi delle colonne per consistenza
      return {
        ...row.data,
        id: row.id,
        orderNumber: row.order_number || row.data.orderNumber,
        opdrachtgever: row.opdrachtgever || row.data.opdrachtgever,
        projectRef: row.project_ref || row.data.projectRef,
        address: row.address || row.data.address,
        scheduledDate: row.scheduled_date || row.data.scheduledDate,
        scheduledEndDate: row.scheduled_end_date || row.data.scheduledEndDate,
        material: row.material || row.data.material,
        status: row.status || row.data.status || 'In afwachting', // ⚠️ CRITICO: Garantisce sempre uno status
        createdAt: row.created_at || row.data.createdAt,
        assignedWorker: row.assigned_worker || row.data.assignedWorker,
        assignmentType: row.assignment_type || row.data.assignmentType,
      };
    } else {
      // Se row.data è null, ricostruiamo l'oggetto minimo dai campi delle colonne
      return {
        id: row.id,
        orderNumber: row.order_number || '',
        opdrachtgever: row.opdrachtgever || '',
        projectRef: row.project_ref || '',
        address: row.address || '',
        scheduledDate: row.scheduled_date || '',
        scheduledEndDate: row.scheduled_end_date || '',
        material: row.material || '',
        status: row.status || 'In afwachting', // ⚠️ Default status
        createdAt: row.created_at || new Date().toISOString(),
        description: '',
        hourBudget: { kbw: 0, plw: 0, wvb: 0, montage: 0, rvs: 0, reis: 0 },
        deliveryDate: '',
        photos: [],
        timeLogs: [],
      };
    }
  });
};

export const saveOrder = async (order: WorkOrder): Promise<boolean> => {
  const row = {
    id: order.id,
    order_number: order.orderNumber,
    opdrachtgever: order.opdrachtgever,
    project_ref: order.projectRef,
    address: order.address,
    scheduled_date: order.scheduledDate,
    scheduled_end_date: order.scheduledEndDate,
    material: order.material,
    status: order.status,
    created_at: order.createdAt,
    assigned_worker: order.assignedWorker,
    assignment_type: order.assignmentType,
    data: order, // Salva l'oggetto completo in JSONB
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('work_orders')
    .upsert(row);

  if (error) {
    console.error('Error saving order:', error);
    return false;
  }
  return true;
};

export const saveAllOrders = async (orders: WorkOrder[]): Promise<boolean> => {
  const rows = orders.map(order => ({
    id: order.id,
    order_number: order.orderNumber,
    opdrachtgever: order.opdrachtgever,
    scheduled_date: order.scheduledDate,
    status: order.status,
    created_at: order.createdAt,
    data: order,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('work_orders')
    .upsert(rows);

  if (error) {
    console.error('Error saving orders:', error);
    return false;
  }
  return true;
};

export const deleteOrder = async (orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('work_orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    return false;
  }
  return true;
};

// ============================================
// WORKERS
// ============================================

export const fetchAllWorkers = async (): Promise<{ workers: string[], workerPasswords: Record<string, string>, workerContacts: Record<string, any> }> => {
  const { data, error } = await supabase
    .from('workers')
    .select('*');

  if (error) {
    console.error('Error fetching workers:', error);
    return { workers: [], workerPasswords: {}, workerContacts: {} };
  }

  const workers = (data || []).map((w: any) => w.name);
  const workerPasswords: Record<string, string> = {};
  const workerContacts: Record<string, any> = {};

  (data || []).forEach((w: any) => {
    if (w.password) workerPasswords[w.name] = w.password;
    if (w.contact_data) workerContacts[w.name] = w.contact_data;
  });

  return { workers, workerPasswords, workerContacts };
};

export const saveWorker = async (name: string, password?: string, contactData?: any): Promise<boolean> => {
  const { error } = await supabase
    .from('workers')
    .upsert({
      id: name,
      name,
      password: password || null,
      contact_data: contactData || null
    });

  if (error) {
    console.error('Error saving worker:', error);
    return false;
  }
  return true;
};

export const deleteWorker = async (name: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workers')
    .delete()
    .eq('name', name);

  if (error) {
    console.error('Error deleting worker:', error);
    return false;
  }
  return true;
};

export const updateWorkerPassword = async (worker: string, password: string): Promise<boolean> => {
  const { error } = await supabase
    .from('workers')
    .update({ password })
    .eq('name', worker);

  if (error) {
    console.error('Error updating password:', error);
    return false;
  }
  return true;
};

export const updateWorkerContacts = async (contacts: Record<string, any>): Promise<boolean> => {
  const promises = Object.entries(contacts).map(([name, contactData]) =>
    supabase
      .from('workers')
      .update({ contact_data: contactData })
      .eq('name', name)
  );

  const results = await Promise.all(promises);
  const hasError = results.some(r => r.error);
  
  if (hasError) {
    console.error('Error updating contacts');
    return false;
  }
  return true;
};

// ============================================
// COMPANY SETTINGS
// ============================================

export const fetchCompanySettings = async (): Promise<CompanySettings | null> => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  return data?.data || null;
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<boolean> => {
  const { error } = await supabase
    .from('company_settings')
    .upsert({
      id: 'default',
      company_id: 'default',
      data: settings,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving settings:', error);
    return false;
  }
  return true;
};

// ============================================
// AVAILABILITIES
// ============================================

export const fetchAllAvailabilities = async (): Promise<WorkerAvailability[]> => {
  const { data, error } = await supabase
    .from('availabilities')
    .select('*');

  if (error) {
    console.error('Error fetching availabilities:', error);
    return [];
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    worker: a.worker,
    date: a.date,
    type: a.type
  }));
};

export const saveAvailability = async (availability: WorkerAvailability): Promise<boolean> => {
  const { error } = await supabase
    .from('availabilities')
    .upsert(availability);

  if (error) {
    console.error('Error saving availability:', error);
    return false;
  }
  return true;
};

export const deleteAvailability = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('availabilities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting availability:', error);
    return false;
  }
  return true;
};

export const saveAllAvailabilities = async (availabilities: WorkerAvailability[]): Promise<boolean> => {
  // Prima cancella tutte
  await supabase.from('availabilities').delete().neq('id', '');
  
  // Poi inserisci le nuove
  const { error } = await supabase
    .from('availabilities')
    .insert(availabilities);

  if (error) {
    console.error('Error saving availabilities:', error);
    return false;
  }
  return true;
};

// ============================================
// RECURRING ABSENCES
// ============================================

export const fetchRecurringAbsences = async (): Promise<RecurringAbsence[]> => {
  const { data, error } = await supabase
    .from('recurring_absences')
    .select('*');

  if (error) {
    console.error('Error fetching recurring absences:', error);
    return [];
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    worker: a.worker,
    type: a.type,
    timeOfDay: a.time_of_day,
    dayOfWeek: a.day_of_week,
    startDate: a.start_date,
    numberOfWeeks: a.number_of_weeks,
    note: a.note
  }));
};

export const saveRecurringAbsence = async (absence: RecurringAbsence): Promise<boolean> => {
  const { error } = await supabase
    .from('recurring_absences')
    .upsert({
      id: absence.id,
      worker: absence.worker,
      type: absence.type,
      time_of_day: absence.timeOfDay,
      day_of_week: absence.dayOfWeek,
      start_date: absence.startDate,
      number_of_weeks: absence.numberOfWeeks,
      note: absence.note
    });

  if (error) {
    console.error('Error saving recurring absence:', error);
    return false;
  }
  return true;
};

// ============================================
// GLOBAL DAYS
// ============================================

export const fetchGlobalDays = async (): Promise<GlobalDay[]> => {
  const { data, error } = await supabase
    .from('global_days')
    .select('*');

  if (error) {
    console.error('Error fetching global days:', error);
    return [];
  }

  return (data || []).map((d: any) => ({
    date: d.date,
    type: d.type
  }));
};

export const saveGlobalDay = async (day: GlobalDay): Promise<boolean> => {
  const { error } = await supabase
    .from('global_days')
    .upsert({ date: day.date, type: day.type });

  if (error) {
    console.error('Error saving global day:', error);
    return false;
  }
  return true;
};

export const deleteGlobalDay = async (date: string): Promise<boolean> => {
  const { error } = await supabase
    .from('global_days')
    .delete()
    .eq('date', date);

  if (error) {
    console.error('Error deleting global day:', error);
    return false;
  }
  return true;
};

// ============================================
// WORK LOGS
// ============================================

export const fetchAllWorkLogs = async (): Promise<WorkLog[]> => {
  const { data, error } = await supabase
    .from('work_logs')
    .select('*');

  if (error) {
    console.error('Error fetching work logs:', error);
    return [];
  }

  return (data || []).map((l: any) => ({
    id: l.id,
    orderId: l.order_id,
    worker: l.worker,
    date: l.date,
    hours: l.hours,
    note: l.note,
    timestamp: l.timestamp,
    category: l.category,
    activity: l.activity
  }));
};

export const saveWorkLog = async (log: WorkLog): Promise<boolean> => {
  const { error } = await supabase
    .from('work_logs')
    .upsert({
      id: log.id,
      order_id: log.orderId,
      worker: log.worker,
      date: log.date,
      hours: log.hours,
      note: log.note,
      timestamp: log.timestamp,
      category: log.category,
      activity: log.activity
    });

  if (error) {
    console.error('Error saving work log:', error);
    return false;
  }
  return true;
};

// ============================================
// BULK SYNC (sostituisce /api/data)
// ============================================

export const fetchAllData = async () => {
  try {
    const [ordersData, workersData, settingsData, availsData, absencesData, globalDaysData, workLogsData] = await Promise.all([
      fetchAllOrders(),
      fetchAllWorkers(),
      fetchCompanySettings(),
      fetchAllAvailabilities(),
      fetchRecurringAbsences(),
      fetchGlobalDays(),
      fetchAllWorkLogs()
    ]);

    return {
      orders: ordersData,
      workers: workersData.workers,
      workerPasswords: workersData.workerPasswords,
      workerContacts: workersData.workerContacts,
      settings: settingsData,
      availabilities: availsData,
      recurringAbsences: absencesData,
      globalDays: globalDaysData,
      workLogs: workLogsData
    };
  } catch (error) {
    console.error('Error fetching all data:', error);
    return {
      orders: [],
      workers: [],
      workerPasswords: {},
      workerContacts: {},
      settings: null,
      availabilities: [],
      recurringAbsences: [],
      globalDays: [],
      workLogs: []
    };
  }
};

export const saveAllData = async (data: {
  orders?: WorkOrder[];
  workers?: string[];
  workerPasswords?: Record<string, string>;
  availabilities?: WorkerAvailability[];
  globalDays?: GlobalDay[];
  workLogs?: WorkLog[];
  settings?: CompanySettings;
}) => {
  try {
    const promises = [];

    if (data.orders) promises.push(saveAllOrders(data.orders));
    if (data.settings) promises.push(saveCompanySettings(data.settings));
    if (data.availabilities) promises.push(saveAllAvailabilities(data.availabilities));
    // Workers e gli altri vengono salvati individualmente tramite le loro funzioni

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error saving all data:', error);
    return false;
  }
};
