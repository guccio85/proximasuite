import { supabase } from './supabaseClient';
import { WorkOrder, CompanySettings, WorkerAvailability, RecurringAbsence, GlobalDay, WorkLog, TimeLog, TaskColors, PurchaseInvoice } from './types';

// v2.3.5 diagnostics: quick connectivity check used at app startup
export const testConnection = async (): Promise<void> => {
  console.log('🔑 VITE_SUPABASE_URL set:', import.meta.env.VITE_SUPABASE_URL ? 'SI ✅' : 'NO ❌');
  console.log('🔑 VITE_SUPABASE_ANON_KEY set:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SI ✅' : 'NO ❌');
  try {
    const { data, error } = await supabase.from('work_orders').select('id').limit(5);
    if (error) {
      console.error('❌ testConnection ERROR:', error.code, error.message, error.details);
    } else {
      console.log('✅ testConnection OK — Righe trovate (limit 5):', data?.length ?? 0, '| IDs:', data?.map((r: any) => r.id));
    }
  } catch (e) {
    console.error('❌ testConnection eccezione:', e);
  }
};

// ============================================
// WORK ORDERS
// ============================================

// v2.3.5: fetchAllOrders supports incremental sync via `since` (ISO timestamp)
// When `since` is provided, returns only rows modified after that time → near-zero egress when nothing changed
export const fetchAllOrders = async (since?: string): Promise<WorkOrder[]> => {
  let query = supabase
    .from('work_orders')
    .select('*');
  // NOTE: removed .order('created_at') — was causing silent Postgres error if column type mismatch

  if (since) {
    query = query.gt('updated_at', since);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching orders from Supabase:', error.code, error.message);
    return [];
  }
  
  if (!data || data.length === 0) {
    // Incremental returning 0 is normal (nothing changed) — only warn on full fetch
    if (!since) console.warn('⚠️ fetchAllOrders: full fetch returned 0 rows — DB may be empty or RLS blocking');
    return [];
  }
  
  console.log('📦 Orders received:', data.length, 'rows', since ? `(incremental since ${since})` : '(full)');
  
  const orders = (data || []).map((row: any, index: number) => {
    if (!row.id) { console.error(`❌ Order at index ${index} has no ID, skipping`); return null; }

    // Strip heavy Base64 fields from the JSONB blob — they are loaded on demand via fetchOrderDetail(id)
    const lightData = row.data && typeof row.data === 'object' ? { ...row.data } : {};
    delete lightData.photos;
    delete lightData.timeLogs;
    delete lightData.drawings;

    return {
      ...lightData,                                              // all planning fields from JSONB (requiredTasks, dates, hourBudget…)
      id:              row.id,
      orderNumber:     row.order_number     || lightData.orderNumber     || '',
      opdrachtgever:   row.opdrachtgever    || lightData.opdrachtgever   || '',
      projectRef:      row.project_ref      || lightData.projectRef      || '',
      address:         row.address          || lightData.address         || '',
      scheduledDate:   row.scheduled_date   || lightData.scheduledDate   || '',
      scheduledEndDate:row.scheduled_end_date || lightData.scheduledEndDate || '',
      material:        row.material         || lightData.material        || '',
      status:          row.status           || lightData.status          || 'In afwachting',
      createdAt:       row.created_at       || lightData.createdAt       || Date.now(),
      assignedWorker:  row.assigned_worker  || lightData.assignedWorker  || '',
      assignmentType:  row.assignment_type  || lightData.assignmentType  || '',
      updated_at:      row.updated_at       || '',
      orderValue:     row.order_value !== undefined ? Number(row.order_value) : lightData.orderValue,
      // Heavy detail fields — empty stubs until fetchOrderDetail() is called
      photos:    [],
      timeLogs:  [],
      drawings:  [],
    } as WorkOrder;
  }).filter((o): o is WorkOrder => o !== null);
  
  console.log('✅ Orders converted successfully:', orders.length);
  
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
    order_value: order.orderValue ?? null,
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

// v2.3.5: Lazy-load full order detail (with photos, drawings, timeLogs) only when user opens it
export const fetchOrderDetail = async (orderId: string): Promise<WorkOrder | null> => {
  const { data, error } = await supabase
    .from('work_orders')
    .select('id, data, status, updated_at')
    .eq('id', orderId)
    .single();

  if (error || !data) {
    console.error('❌ Error fetching order detail:', error);
    return null;
  }

  if (data.data && typeof data.data === 'object') {
    return {
      ...data.data,
      id: data.id,
      status: data.status || data.data.status,
    } as WorkOrder;
  }
  return null;
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
  // v2.3.5 Bis: exclude contact_data (contains photo Base64) from sync — loaded lazily via fetchWorkerContact()
  const { data, error } = await supabase
    .from('workers')
    .select('id, name, password');

  if (error) {
    console.error('Error fetching workers:', error);
    return { workers: [], workerPasswords: {}, workerContacts: {} };
  }

  const workers = (data || []).map((w: any) => w.name);
  const workerPasswords: Record<string, string> = {};

  (data || []).forEach((w: any) => {
    if (w.password) workerPasswords[w.name] = w.password;
  });

  return { workers, workerPasswords, workerContacts: {} };
};

// v2.3.5 Bis: Lazy-load contact detail (including photo) for a single worker — called only when admin opens profile
export const fetchWorkerContact = async (workerName: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('workers')
    .select('contact_data')
    .eq('name', workerName)
    .single();
  if (error || !data) return null;
  return (data as any).contact_data || null;
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
    // Fetch basic settings — v2.3.5 Bis: exclude logo_url (Base64) from sync cycle; use fetchCompanyLogo() once at startup
    const { data: settingsData, error: settingsError } = await supabase
      .from('company_settings')
      .select('id, company_name, admin_password, admin_profiles, mobile_permissions')
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
          // Deduplicazione attività per sicurezza (protezione da race conditions)
          activities: [...new Set((activitiesData || []).map((a: any) => a.activity))]
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

    // Construct CompanySettings object (include ALL fetched data)
    const rawMobilePerms = settingsData?.mobile_permissions || {};
    const { __logoUrl, ...cleanMobilePerms } = rawMobilePerms as any;
    const settings: CompanySettings = {
      name: settingsData?.company_name || '',
      logoUrl: __logoUrl || undefined, // logo_url excluded from sync; loaded once at startup via fetchCompanyLogo()
      primaryColor: undefined, // column removed from schema — not used
      taskColors: taskColors, // Include fetched colors
      adminPassword: settingsData?.admin_password || '1111',
      adminProfiles: settingsData?.admin_profiles || [],
      departments: departments.length > 0 ? departments : undefined, // Include fetched departments
      subcontractors: subcontractors.length > 0 ? subcontractors : undefined, // Include fetched subcontractors
      mobilePermissions: Object.keys(cleanMobilePerms).length > 0 ? cleanMobilePerms : undefined,
      workerPasswords: {}, // Loaded separately from workers table
      workerContacts: {}, // Merged in fetchAllData
      security: undefined
    };
    return settings;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }
};

// v2.3.5 Bis: Load company logo once at startup — NOT included in 4-second sync cycle
export const fetchCompanyLogo = async (): Promise<string | undefined> => {
  // logo_url column does not exist in schema — logo is stored inside mobile_permissions JSONB as __logoUrl
  const { data, error } = await supabase
    .from('company_settings')
    .select('mobile_permissions')
    .eq('id', 'default')
    .single();
  if (error || !data) return undefined;
  return ((data as any).mobile_permissions as any)?.__logoUrl || undefined;
};

// ============================================
// STORAGE FUNCTIONS (Supabase Storage)
// ============================================

export const uploadGlbModel = async (orderId: string, file: File): Promise<string | null> => {
  try {
    const path = `${orderId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('order-models').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('order-models').getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading GLB model:', error);
    return null;
  }
};

export const deleteGlbModel = async (glbUrl: string): Promise<void> => {
  try {
    const urlParts = glbUrl.split('/order-models/');
    if (urlParts.length > 1) {
      await supabase.storage.from('order-models').remove([urlParts[1]]);
    }
  } catch (error) {
    console.error('Error deleting GLB model:', error);
  }
};

// ============================================
// DIRECT PATCH FUNCTIONS (bypass complex pipeline)
// ============================================

export const saveAdminProfilesDirect = async (profiles: any[]): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('company_settings')
      .update({ admin_profiles: profiles, updated_at: new Date().toISOString() })
      .eq('id', 'default');
    if (error) {
      // Fallback: try upsert if row doesn't exist
      const { error: upsertError } = await supabase
        .from('company_settings')
        .upsert({ id: 'default', company_name: '', admin_password: '1111', admin_profiles: profiles, updated_at: new Date().toISOString() });
      if (upsertError) throw upsertError;
    }
    return true;
  } catch (error) {
    console.error('Error saving admin profiles:', error);
    return false;
  }
};

export const saveMobilePermissionsDirect = async (permissions: any, logoUrl?: string): Promise<boolean> => {
  try {
    // Se logoUrl non viene passato, leggi il valore esistente dal DB per non sovrascriverlo con null
    let resolvedLogoUrl = logoUrl;
    if (resolvedLogoUrl === undefined) {
      const { data } = await supabase.from('company_settings').select('mobile_permissions').eq('id', 'default').single();
      resolvedLogoUrl = (data?.mobile_permissions as any)?.__logoUrl || undefined;
    }
    const permsWithLogo = { ...(permissions || {}), __logoUrl: resolvedLogoUrl || null };
    const { error } = await supabase
      .from('company_settings')
      .update({ mobile_permissions: permsWithLogo, updated_at: new Date().toISOString() })
      .eq('id', 'default');
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving mobile permissions:', error);
    return false;
  }
};

export const saveSubcontractorsDirect = async (subcontractors: any[]): Promise<boolean> => {
  try {
    const currentIds = subcontractors.map(s => s.id);
    if (currentIds.length > 0) {
      await supabase.from('subcontractors').delete().not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`);
    } else {
      await supabase.from('subcontractors').delete().neq('id', '');
    }
    for (const sub of subcontractors) {
      await supabase.from('subcontractors').upsert({
        id: sub.id, name: sub.name, email: sub.email || null,
        phone: sub.phone || null, address: sub.address || null, contact_person: sub.contactPerson || null
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving subcontractors:', error);
    return false;
  }
};

export const saveDepartmentsDirect = async (departments: any[]): Promise<boolean> => {
  try {
    const currentIds = departments.map(d => d.id);
    // Elimina i reparti rimossi
    if (currentIds.length > 0) {
      const { data: existing } = await supabase.from('departments').select('id');
      const toDelete = (existing || []).map((r: any) => r.id).filter((id: string) => !currentIds.includes(id));
      for (const id of toDelete) {
        await supabase.from('department_activities').delete().eq('department_id', id);
        await supabase.from('departments').delete().eq('id', id);
      }
    } else {
      await supabase.from('department_activities').delete().neq('department_id', '');
      await supabase.from('departments').delete().neq('id', '');
    }
    // Upsert reparti rimasti + attività
    for (let i = 0; i < departments.length; i++) {
      const dept = departments[i];
      await supabase.from('departments').upsert({ id: dept.id, name: dept.name, sort_order: i });
      await supabase.from('department_activities').delete().eq('department_id', dept.id);
      if (dept.activities && dept.activities.length > 0) {
        for (let j = 0; j < dept.activities.length; j++) {
          await supabase.from('department_activities').insert({ department_id: dept.id, activity: dept.activities[j], sort_order: j });
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error saving departments:', error);
    return false;
  }
};

export const saveCompanyDetailsDirect = async (name: string, logoUrl?: string | null, existingPermissions?: any): Promise<boolean> => {
  try {
    const permsWithLogo = { ...(existingPermissions || {}), __logoUrl: logoUrl || null };
    const { error } = await supabase
      .from('company_settings')
      .update({ company_name: name, mobile_permissions: permsWithLogo, updated_at: new Date().toISOString() })
      .eq('id', 'default');
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving company details:', error);
    return false;
  }
};

export const saveCompanySettings = async (settings: CompanySettings): Promise<boolean> => {
  try {
    // Merge logoUrl into mobile_permissions JSONB (logo_url column not yet in schema)
    const mobilePermsWithLogo = {
      ...(settings.mobilePermissions || {}),
      __logoUrl: settings.logoUrl || null
    };

    // Save basic settings
    const { error: settingsError } = await supabase
      .from('company_settings')
      .upsert({
        id: 'default',
        company_name: settings.name,
        admin_password: settings.adminPassword,
        admin_profiles: settings.adminProfiles || [],
        mobile_permissions: mobilePermsWithLogo,
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

    // Save subcontractors: delete removed ones first, then upsert remaining
    if (settings.subcontractors !== undefined) {
      const currentIds = (settings.subcontractors || []).map(s => s.id);
      // Delete subcontractors that are no longer in the list
      if (currentIds.length > 0) {
        await supabase.from('subcontractors').delete().not('id', 'in', `(${currentIds.map(id => `"${id}"`).join(',')})`);
      } else {
        // List is empty — delete all
        await supabase.from('subcontractors').delete().neq('id', '');
      }
      for (const sub of settings.subcontractors || []) {
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

export const deleteWorkLog = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('work_logs').delete().eq('id', id);
  if (error) { console.error('Error deleting work log:', error); return false; }
  return true;
};

export const updateWorkLog = async (id: string, hours: number, note: string): Promise<boolean> => {
  const { error } = await supabase.from('work_logs').update({ hours, note }).eq('id', id);
  if (error) { console.error('Error updating work log:', error); return false; }
  return true;
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
// PURCHASE INVOICES (v2.4.0)
// ============================================

export const fetchPurchaseInvoices = async (): Promise<PurchaseInvoice[]> => {
  const { data, error } = await supabase
    .from('purchase_invoices')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) { console.error('Error fetching purchase invoices:', error); return []; }
  return (data || []).map((row: any): PurchaseInvoice => ({
    id: row.id,
    orderId: row.order_id,
    supplier: row.supplier || '',
    description: row.description || '',
    amount: Number(row.amount) || 0,
    date: row.date || '',
    category: row.category || 'ALTRO',
    timestamp: Number(row.timestamp) || Date.now(),
  }));
};

export const savePurchaseInvoice = async (inv: PurchaseInvoice): Promise<boolean> => {
  const { error } = await supabase
    .from('purchase_invoices')
    .upsert({
      id: inv.id,
      order_id: inv.orderId,
      supplier: inv.supplier,
      description: inv.description,
      amount: inv.amount,
      date: inv.date,
      category: inv.category,
      timestamp: inv.timestamp,
    });
  if (error) { console.error('Error saving purchase invoice:', error); return false; }
  return true;
};

export const deletePurchaseInvoice = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('purchase_invoices').delete().eq('id', id);
  if (error) { console.error('Error deleting purchase invoice:', error); return false; }
  return true;
};



// v2.3.5: accepts `since` for incremental order sync
export const fetchAllData = async (since?: string) => {
  try {
    const [ordersData, workersData, settingsData, availsData, absencesData, globalDaysData, workLogsData, purchaseInvoicesData] = await Promise.all([
      fetchAllOrders(since),
      fetchAllWorkers(),
      fetchCompanySettings(),
      fetchAllAvailabilities(),
      fetchRecurringAbsences(),
      fetchGlobalDays(),
      fetchAllWorkLogs(),
      fetchPurchaseInvoices()
    ]);

    // Merge workerContacts from workers table into settings
    const settingsWithContacts = settingsData ? {
      ...settingsData,
      workerContacts: workersData.workerContacts || {}
    } : null;

    return {
      orders: ordersData,
      workers: workersData.workers,
      workerPasswords: workersData.workerPasswords,
      workerContacts: workersData.workerContacts,
      settings: settingsWithContacts,
      availabilities: availsData,
      recurringAbsences: absencesData,
      globalDays: globalDaysData,
      workLogs: workLogsData,
      purchaseInvoices: purchaseInvoicesData
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
      workLogs: [],
      purchaseInvoices: []
    };
  }
};

export const deleteAllData = async (): Promise<boolean> => {
  try {
    await supabase.from('work_orders').delete().neq('id', '');
    await supabase.from('workers').delete().neq('id', '');
    await supabase.from('availabilities').delete().neq('id', '');
    await supabase.from('recurring_absences').delete().neq('id', '');
    await supabase.from('global_days').delete().neq('date', '');
    await supabase.from('work_logs').delete().neq('id', '');
    await supabase.from('time_logs').delete().neq('id', '');
    await supabase.from('task_colors').delete().neq('id', '');
    await supabase.from('departments').delete().neq('id', '');
    await supabase.from('department_activities').delete().gt('id', 0);
    await supabase.from('subcontractors').delete().neq('id', '');
    await supabase.from('company_settings').delete().neq('id', '');
    return true;
  } catch (error) {
    console.error('Error deleting all data:', error);
    return false;
  }
};

export const saveAllRecurringAbsences = async (absences: RecurringAbsence[]): Promise<boolean> => {
  try {
    console.log('💾 saveAllRecurringAbsences — count:', absences.length);
    // Step 1: delete all existing rows
    const { error: delError } = await supabase.from('recurring_absences').delete().not('id', 'is', null);
    if (delError) { console.error('❌ Error deleting recurring absences:', delError); return false; }
    // Step 2: insert new rows one by one (upsert avoids unique conflicts)
    for (const a of absences) {
      const { error } = await supabase.from('recurring_absences').upsert({
        id: a.id,
        worker: a.worker,
        type: a.type,
        time_of_day: a.timeOfDay,
        day_of_week: a.dayOfWeek,
        start_date: a.startDate,
        number_of_weeks: a.numberOfWeeks,
        note: a.note
      });
      if (error) { console.error('❌ Error upserting recurring absence:', a.id, error); }
    }
    console.log('✅ Recurring absences saved to Supabase');
    return true;
  } catch (error) {
    console.error('❌ saveAllRecurringAbsences exception:', error);
    return false;
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
  recurringAbsences?: RecurringAbsence[];
}) => {
  try {
    const promises = [];

    if (data.orders) promises.push(saveAllOrders(data.orders));
    if (data.settings) promises.push(saveCompanySettings(data.settings));
    if (data.availabilities) promises.push(saveAllAvailabilities(data.availabilities));
    if (data.recurringAbsences !== undefined) promises.push(saveAllRecurringAbsences(data.recurringAbsences));
    // Workers e gli altri vengono salvati individualmente tramite le loro funzioni

    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error('Error saving all data:', error);
    return false;
  }
};
