import { supabase } from './supabaseClient';
import { WorkOrder, CompanySettings, WorkerAvailability, RecurringAbsence, GlobalDay, WorkLog, TimeLog, TaskColors } from './types';

// ============================================
// WORK ORDERS
// ============================================

export const fetchAllOrders = async (): Promise<WorkOrder[]> => {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching orders from Supabase:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return [];
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ No orders found in Supabase');
    return [];
  }
  
  console.log('📦 Supabase raw data received:', data.length, 'rows');
  console.log('📦 First raw row sample:', JSON.stringify(data[0], null, 2).substring(0, 500));
  
  // Converti da formato Supabase a formato app
  // IMPORTANTE: Se row.data è null/undefined, ricostruiamo l'oggetto dai campi delle colonne
  const orders = (data || []).map((row: any, index: number) => {
    // Validazione base
    if (!row.id) {
      console.error(`❌ Order at index ${index} has no ID, skipping`);
      return null;
    }
    
    if (row.data && typeof row.data === 'object') {
      // Se esiste JSONB data, usalo come base e sovrascrivi con campi delle colonne
      const order = {
        ...row.data,
        id: row.id, // ✅ SEMPRE usa l'ID della tabella (che è l'ID originale)
        orderNumber: row.order_number || row.data.orderNumber || '',
        opdrachtgever: row.opdrachtgever || row.data.opdrachtgever || '',
        projectRef: row.project_ref || row.data.projectRef || '',
        address: row.address || row.data.address || '',
        scheduledDate: row.scheduled_date || row.data.scheduledDate || '',
        scheduledEndDate: row.scheduled_end_date || row.data.scheduledEndDate || '',
        material: row.material || row.data.material || '',
        status: row.status || row.data.status || 'In afwachting',
        createdAt: row.created_at || row.data.createdAt || Date.now(),
        assignedWorker: row.assigned_worker || row.data.assignedWorker || '',
        assignmentType: row.assignment_type || row.data.assignmentType || '',
        // Assicura che i campi essenziali esistano
        hourBudget: row.data.hourBudget || { kbw: 0, plw: 0, wvb: 0, montage: 0, rvs: 0, reis: 0 },
        photos: row.data.photos || [],
        timeLogs: row.data.timeLogs || [],
        description: row.data.description || '',
      };
      return order;
    } else {
      // Se row.data è null, ricostruiamo l'oggetto minimo dai campi delle colonne
      console.warn('⚠️ Order with null data field, using column values. ID:', row.id);
      return {
        id: row.id,
        orderNumber: row.order_number || '',
        opdrachtgever: row.opdrachtgever || '',
        projectRef: row.project_ref || '',
        address: row.address || '',
        scheduledDate: row.scheduled_date || '',
        scheduledEndDate: row.scheduled_end_date || '',
        material: row.material || '',
        status: row.status || 'In afwachting',
        createdAt: row.created_at || Date.now(),
        description: '',
        hourBudget: { kbw: 0, plw: 0, wvb: 0, montage: 0, rvs: 0, reis: 0 },
        deliveryDate: '',
        photos: [],
        timeLogs: [],
      };
    }
  }).filter(order => order !== null);
  
  console.log('✅ Orders converted successfully:', orders.length);
  if (orders.length > 0) {
    console.log('📊 Sample orders:', orders.slice(0, 3).map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      scheduledDate: o.scheduledDate
    })));
  } else {
    console.warn('⚠️ No orders to display after conversion');
  }
  
  return orders;
};

export const saveOrder = async (order: WorkOrder): Promise<boolean> => {
  const row = {
    id: order.id,
    order_number: order.orderNumber ?? '',
    opdrachtgever: order.opdrachtgever ?? '',
    project_ref: order.projectRef ?? null,
    address: order.address ?? '',
    scheduled_date: order.scheduledDate ?? null,
    scheduled_end_date: order.scheduledEndDate ?? null,
    material: order.material ?? '',
    status: order.status ?? 'In afwachting',
    created_at: order.createdAt ?? new Date().toISOString(),
    assigned_worker: order.assignedWorker ?? null,
    assignment_type: order.assignmentType ?? null,
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
    order_number: order.orderNumber ?? '',
    opdrachtgever: order.opdrachtgever ?? '',
    scheduled_date: order.scheduledDate ?? null,
    status: order.status ?? 'In afwachting',
    created_at: order.createdAt ?? new Date().toISOString(),
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
  try {
    // Fetch basic settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError);
      return null;
    }

    // Fetch task colors
    const { data: colorsData, error: colorsError } = await supabase
      .from('task_colors')
      .select('*');

    const taskColors: TaskColors = {
      kbw: '#f5e000',
      plw: '#026df7',
      montage: '#fa0000',
      werkvoorbereid: '#795420',
      holiday: '#2deb70',
      adv: '#9762d0'
    };
    
    if (!colorsError && colorsData) {
      colorsData.forEach((row: any) => {
        if (row.task_key in taskColors) {
          (taskColors as any)[row.task_key] = row.color;
        }
      });
    }

    // Fetch departments with activities
    const { data: deptsData, error: deptsError } = await supabase
      .from('departments')
      .select('*')
      .order('sort_order');

    const departments: any[] = [];
    if (!deptsError && deptsData) {
      for (const dept of deptsData) {
        const { data: activitiesData } = await supabase
          .from('department_activities')
          .select('*')
          .eq('department_id', dept.id)
          .order('sort_order');

        departments.push({
          id: dept.id,
          name: dept.name,
          activities: (activitiesData || []).map((a: any) => a.activity)
        });
      }
    }

    // Fetch subcontractors
    const { data: subsData, error: subsError } = await supabase
      .from('subcontractors')
      .select('*');

    const subcontractors: any[] = [];
    if (!subsError && subsData) {
      subsData.forEach((sub: any) => {
        subcontractors.push({
          id: sub.id,
          name: sub.name,
          email: sub.email,
          phone: sub.phone,
          address: sub.address,
          contactPerson: sub.contact_person
        });
      });
    }

    // Construct CompanySettings object
    const settings: CompanySettings = {
      name: settingsData?.company_name || '',
      logoUrl: settingsData?.logo_url || undefined,
      primaryColor: settingsData?.primary_color || undefined,
      taskColors: undefined, // Loaded separately
      adminPassword: settingsData?.admin_password || '1111',
      adminProfiles: settingsData?.admin_profiles || [],
      departments: undefined, // Loaded separately
      subcontractors: undefined, // Loaded separatamente
      mobilePermissions: settingsData?.mobile_permissions || undefined,
      workerPasswords: {}, // Loaded separately from workers table
      workerContacts: {}, // Loaded separately from workers table
      security: undefined
    };
    return settings;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<boolean> => {
  try {
    // Save basic settings
    const { error: settingsError } = await supabase
      .from('company_settings')
      .upsert({
        id: 'default',
        company_name: settings.name,
        admin_password: settings.adminPassword,
        admin_profiles: settings.adminProfiles || [],
        mobile_permissions: settings.mobilePermissions,
        updated_at: new Date().toISOString()
      });

    if (settingsError) throw settingsError;

    // Save task colors
    if (settings.taskColors) {
      for (const [key, color] of Object.entries(settings.taskColors)) {
        await supabase
          .from('task_colors')
          .upsert({
            id: key,
            task_key: key,
            color: color
          });
      }
    }

    // Save departments (simplified - full implementation would handle activities)
    if (settings.departments) {
      for (let i = 0; i < settings.departments.length; i++) {
        const dept = settings.departments[i];
        const { error: deptError } = await supabase
          .from('departments')
          .upsert({
            id: dept.id,
            name: dept.name,
            sort_order: i
          });

        if (deptError) {
          console.error('Error saving department:', deptError);
          continue;
        }

        // Delete existing activities and insert new ones
        await supabase
          .from('department_activities')
          .delete()
          .eq('department_id', dept.id);

        if (dept.activities && dept.activities.length > 0) {
          for (let j = 0; j < dept.activities.length; j++) {
            await supabase
              .from('department_activities')
              .insert({
                department_id: dept.id,
                activity: dept.activities[j],
                sort_order: j
              });
          }
        }
      }
    }

    // Save subcontractors
    if (settings.subcontractors) {
      for (const sub of settings.subcontractors) {
        await supabase
          .from('subcontractors')
          .upsert({
            id: sub.id,
            name: sub.name,
            email: sub.email,
            phone: sub.phone,
            address: sub.address,
            contact_person: sub.contactPerson
          });
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving company settings:', error);
    return false;
  }
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
