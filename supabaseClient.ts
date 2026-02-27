// v1.0.1 - Cache busting: override fetch globale per forzare no-cache su tutte le chiamate REST Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      return fetch(url, {
        ...options,
        headers: {
          ...(options?.headers ?? {}),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      });
    }
  }
});

// Database Types
export interface SupabaseWorkOrder {
  id: string;
  order_number: string;
  opdrachtgever: string;
  project_ref?: string;
  address?: string;
  scheduled_date: string;
  scheduled_end_date?: string;
  material?: string;
  required_tasks?: string[];
  is_subcontracted?: boolean;
  subcontractor_name?: string;
  subcontractor_delivery_date?: string;
  photos?: string[];
  drawings?: string[];
  hour_budget?: Record<string, number>;
  ready_for_archive?: boolean;
  archive_note?: string;
  // ... tutti gli altri campi WorkOrder
  status: string;
  created_at: number;
  assigned_worker?: string;
  assignment_type?: string;
  time_logs?: any[];
  data: any; // JSONB con tutti i dati completi dell'ordine
}

export interface SupabaseWorker {
  id: string;
  name: string;
  password?: string;
  contact_data?: any; // JSONB con foto, email, phone, address
  created_at: string;
}

export interface SupabaseSettings {
  id: string;
  company_id: string;
  data: any; // JSONB con tutti i settings
  updated_at: string;
}

export interface SupabaseAvailability {
  id: string;
  worker: string;
  date: string;
  type: string;
  created_at: string;
}

export interface SupabaseWorkLog {
  id: string;
  order_id: string;
  worker: string;
  date: string;
  hours: number;
  note: string;
  timestamp: number;
  category?: string;
  activity?: string;
}
