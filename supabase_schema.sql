-- SNEP SMART Supabase Schema
-- Esegui questo script nel SQL Editor di Supabase

-- Table: work_orders
CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  opdrachtgever TEXT,
  project_ref TEXT,
  address TEXT,
  scheduled_date TEXT,
  scheduled_end_date TEXT,
  material TEXT,
  status TEXT NOT NULL,
  created_at BIGINT,
  assigned_worker TEXT,
  assignment_type TEXT,
  data JSONB, -- Contiene TUTTI i dati dell'ordine in formato completo
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: workers
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  password TEXT,
  contact_data JSONB, -- {photo, email, phone, address, notes}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: company_settings
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL,
  admin_password TEXT NOT NULL,
  admin_profiles JSONB, -- [{id, name, password, role, permissions}]
  mobile_permissions JSONB, -- {showClientName, allowPhotoUpload, allowDrawingsView}
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: task_colors
CREATE TABLE IF NOT EXISTS task_colors (
  id TEXT PRIMARY KEY,
  task_key TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: department_activities
CREATE TABLE IF NOT EXISTS department_activities (
  id SERIAL PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: subcontractors
CREATE TABLE IF NOT EXISTS subcontractors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: availabilities
CREATE TABLE IF NOT EXISTS availabilities (
  id TEXT PRIMARY KEY,
  worker TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: recurring_absences
CREATE TABLE IF NOT EXISTS recurring_absences (
  id TEXT PRIMARY KEY,
  worker TEXT NOT NULL,
  type TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  number_of_weeks INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: global_days
CREATE TABLE IF NOT EXISTS global_days (
  id SERIAL PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: work_logs
CREATE TABLE IF NOT EXISTS work_logs (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  worker TEXT NOT NULL,
  date TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  note TEXT,
  timestamp BIGINT,
  category TEXT,
  activity TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: time_logs (per tracking ore dettagliate)
CREATE TABLE IF NOT EXISTS time_logs (
  id TEXT PRIMARY KEY,
  worker TEXT NOT NULL,
  date TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  note TEXT,
  timestamp BIGINT,
  category TEXT,
  activity TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes per performance
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_date ON work_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_workers_name ON workers(name);
CREATE INDEX IF NOT EXISTS idx_availabilities_worker_date ON availabilities(worker, date);
CREATE INDEX IF NOT EXISTS idx_work_logs_order ON work_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_worker ON work_logs(worker);
CREATE INDEX IF NOT EXISTS idx_task_colors_key ON task_colors(task_key);
CREATE INDEX IF NOT EXISTS idx_department_activities_dept ON department_activities(department_id);

-- Enable Row Level Security (opzionale, ma consigliato)
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;

-- Policy: consenti tutto per ora (modifica in produzione con auth)
CREATE POLICY "Enable all for anon" ON work_orders FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON workers FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON company_settings FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON availabilities FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON recurring_absences FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON global_days FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON work_logs FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON time_logs FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON task_colors FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON departments FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON department_activities FOR ALL USING (true);
CREATE POLICY "Enable all for anon" ON subcontractors FOR ALL USING (true);
