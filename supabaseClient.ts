import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtzbyxccephundgllvrnu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0emJ5eGNlcGh1bmRnbGx2cm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NzkyOTAsImV4cCI6MjA4NzM1NTI5MH0.nUtniRGqV6JldYzweXZUxTkThYTHGLvqlh_kg0JRQxo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
