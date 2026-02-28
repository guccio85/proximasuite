

export enum OrderStatus {
  PENDING = 'In afwachting',
  IN_PROGRESS = 'In uitvoering',
  COMPLETED = 'Voltooid',
  CANCELLED = 'Geannuleerd'
}

export type AssignmentType = 'WORK' | 'ABSENT' | 'VACATION';
export type UserRole = 'admin' | 'user' | null;

export type GlobalDayType = 'HOLIDAY' | 'ADV';

export type Language = 'nl' | 'en' | 'it' | 'pl';

export interface TimeLog {
  id: string;
  worker: string;
  date: string; // ISO YYYY-MM-DD
  hours: number;
  note?: string;
  timestamp: number;
  category?: string; // es. 'KBW', 'PLW', 'MONTAGE'
  activity?: string; // es. 'Zagen', 'Kanten', 'Reistijd'
}

export type WorkerPasswords = Record<string, string>;

export interface GlobalDay {
  date: string; // ISO YYYY-MM-DD
  type: GlobalDayType;
}

export interface TaskColors {
  kbw: string;
  plw: string;
  montage: string;
  werkvoorbereid: string; 
  holiday: string; 
  adv: string;     
}

export interface AdminPermissions {
  viewPlanner: boolean;
  editPlanner: boolean;
  viewOrders: boolean;
  editOrders: boolean;
  viewEmployees: boolean;
  editEmployees: boolean;
  viewStatistics: boolean;
  viewSettings: boolean;
  editSettings: boolean;
  manageBackup: boolean;
  deleteOrders: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  viewPlanner: true,
  editPlanner: true,
  viewOrders: true,
  editOrders: true,
  viewEmployees: true,
  editEmployees: true,
  viewStatistics: true,
  viewSettings: true,
  editSettings: true,
  manageBackup: true,
  deleteOrders: true,
};

export interface AdminProfile {
  id: string;
  name: string;
  password: string;
  role?: 'admin' | 'manager' | 'viewer';
  permissions?: AdminPermissions;
}

export interface WorkerContact {
  photo?: string;       // Base64 data URI
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Subcontractor {
  id: string;
  name: string;           // Nome ditta
  email?: string;         
  phone?: string;         
  address?: string;       
  contactPerson?: string; // Nome della persona di contatto
}

export interface Department {
  id: string;
  name: string;
  activities: string[]; // ['Zagen', 'Lassen', etc]
  activityVisibility?: Record<string, boolean>; // Track which activities show in planner
}

export interface WorkerMobilePermissions {
  showClientName: boolean;
  allowPhotoUpload: boolean;
  allowDrawingsView: boolean;
  showAddress: boolean;
}

export type MobilePermissions = Record<string, WorkerMobilePermissions>;

export interface CompanySettings {
  name: string;
  logoUrl?: string; // Base64 data URI
  primaryColor?: string; 
  taskColors?: TaskColors; 
  adminPassword?: string; 
  adminProfiles?: AdminProfile[];
  
  // DYNAMIC CONFIGURATION (V2)
  departments?: Department[];
  subcontractors?: Subcontractor[];
  mobilePermissions?: MobilePermissions;
  workerPasswords?: WorkerPasswords;
  workerContacts?: Record<string, WorkerContact>;

  security?: {
    userPassword?: string;
  };
}

export interface WorkLog {
  id: string;
  orderId: string;
  worker: string;
  date: string; // ISO Date YYYY-MM-DD
  hours: number; 
  // Changed description to note to match TimeLog and fix interface inconsistency
  note: string;
  timestamp: number;
  photos?: string[]; 
  hoursBreakdown?: {
    kbw?: number;
    plw?: number;
    extra?: number;
    boren?: number;
    gaten?: number;
    zaggen?: number;
  };
  category?: string;
  activity?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  opdrachtgever: string; 
  projectRef?: string;   
  address?: string;      
  scheduledDate: string; // Main reference date
  scheduledEndDate?: string; // End date (auto-calculated)
  
  material?: string; // 'RVS', 'STAAL', 'ANDERE'
  
  requiredTasks?: string[]; // es. ['KBW', 'PLW', 'MON', 'WVB']
  
  // SUBCONTRACTOR FIELDS (v6.8.25)
  isSubcontracted?: boolean;
  subcontractorName?: string;
  subcontractorDeliveryDate?: string; // Data consegna da ditta esterna (ISO YYYY-MM-DD)
  missingAssignment?: boolean; // Flag: subcontractor/worker removed, order needs review

  // PHOTOS (v6.8.27) - Base64 Strings
  photos?: string[];
  
  // DRAWINGS (v6.7.05) - Base64 Strings (PDF)
  drawings?: string[];

  // 3D MODEL (v6.8.26) - Supabase Storage URL
  glbUrl?: string;

  // BUDGET ORE (Importato da Excel)
  hourBudget?: {
      kbw?: number;
      plw?: number;
      montage?: number;
      wvb?: number;
      engineering?: number;
      [key: string]: number | undefined;
  };

  // FLUSSO OFFICINA -> UFFICIO
  readyForArchive?: boolean; // True se l'officina ha finito
  archiveNote?: string; // Nota finale dell'officina

  workPreparationDate?: string; 
  workPreparationEndDate?: string; 
  workPreparationWorker?: string; 

  // --- KBW ---
  kbwDate?: string;
  kbwEndDate?: string;
  kbwWorker?: string;

  // --- PLW ---
  plwDate?: string;
  plwEndDate?: string;
  plwWorker?: string;

  // --- CONSERVERING ---
  thermischVerzinkt?: boolean;   
  stralen?: boolean;             
  stralenPrimer?: boolean;       
  schoopperenPrimer?: boolean;   
  poedercoaten?: boolean;        
  onbehandeld?: boolean;         
  natlakken?: boolean;           
  
  preservationType?: string; 
  preservationParts?: string[]; 
  preservationDate?: string; 
  preservationEndDate?: string; 

  startDate?: string;    
  startWorker?: string;  

  endDate?: string;      
  endWorker?: string;    

  measurementDate?: string; 
  measurementEndDate?: string; 
  measurementWorker?: string; 

  deliveryDate?: string; 
  deliveryWorker?: string; 

  installationDate?: string; 
  installationEndDate?: string; 
  installationWorker?: string; 

  description?: string;
  status: OrderStatus;
  createdAt: number;
  assignedWorker?: string; 
  assignmentType?: AssignmentType;

  timeLogs?: TimeLog[];
}

export type AbsenceType = 'SICK' | 'VACATION' | 'ABSENT';
export type AbsenceTime = 'MORNING' | 'AFTERNOON' | 'ALL_DAY';

export interface RecurringAbsence {
  id: string;
  worker: string;
  type: AbsenceType;        // SICK, VACATION, ABSENT
  timeOfDay: AbsenceTime;   // MORNING, AFTERNOON, ALL_DAY
  dayOfWeek: number;        // 0-6 (0=Sunday, 1=Monday, etc.)
  startDate: string;        // ISO YYYY-MM-DD
  numberOfWeeks: number;    // How many weeks to repeat
  note?: string;
}

export interface WorkerAvailability {
  id: string;
  worker: string;
  date: string;
  type: AssignmentType;
}

export interface ExtractedOrderData {
  orderNumber?: string;
  opdrachtgever?: string;
  projectRef?: string;
  address?: string;
  date?: string;
  deliveryDate?: string;
  measurementDate?: string;
  description?: string;
  
  thermischVerzinkt?: boolean;
  stralen?: boolean;
  stralenPrimer?: boolean;
  schoopperenPrimer?: boolean;
  poedercoaten?: boolean;
  onbehandeld?: boolean;
  
  preservationType?: string; 
  preservationParts?: string[]; 
  requiredTasks?: string[]; 
  
  hourBudget?: {
      kbw?: number;
      plw?: number;
      montage?: number;
      wvb?: number;
      [key: string]: number | undefined;
  };
}

export interface SystemCheck {
  id: string;
  name: string;
  path: string;
  exists: boolean;
}