export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum PlanTier {
  BASIC = "Basic",
  PRO = "Pro",
  PREMIUM = "Premium",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanTier;
  joinedDate: string;
  password?: string; // Optional for security in frontend, but used in mock storage
  authProvider?: "email" | "google";
}

export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "paused"
  | "blocked"
  | "canceled"
  | "deferred";

export interface Task {
  id: string;
  userId: string;
  title: string;
  status: TaskStatus;
  completed?: boolean; // Deprecated, kept for migration
  createdAt: string;
  priority: "low" | "medium" | "high";
}

export interface RoutineStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Routine {
  id: string;
  userId: string;
  title: string;
  time: string; // e.g. "08:00"
  category:
    | "morning"
    | "afternoon"
    | "night"
    | "health"
    | "productivity"
    | "focus"
    | "emotional";
  frequency: string[]; // ['Seg', 'Ter', ...]
  steps: RoutineStep[];
  completed: boolean; // Computed based on steps usually
}

export type MoodType = "great" | "good" | "neutral" | "bad" | "terrible";

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  mood: MoodType;
  reasons: string[];
  tags: string[];
  content: string;
}

export interface Comment {
  id: string;
  lessonId: string; // Using lesson title as ID in this context
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userPlan: PlanTier;
  content: string;
  image?: string; // Optional image URL/Placeholder
  likes: number;
  commentsCount: number;
  likedBy: string[]; // List of user IDs who liked
  createdAt: string;
}
export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replyToId?: string; // ID of the comment being replied to (optional)
  likes: number;
}
export const PLAN_FEATURES = {
  [PlanTier.BASIC]: {
    maxTasksPerDay: 5,
    maxRoutines: 2,
    statsHistory: 7, // days
    storage: "1 mês",
    support: "E-mail (48h)",
    canExportPDF: false,
    hasPomodoro: false,
    hasClasses: false,
    hasJournal: false,
  },
  [PlanTier.PRO]: {
    maxTasksPerDay: Infinity,
    maxRoutines: Infinity,
    statsHistory: 30,
    storage: "6 meses",
    support: "WhatsApp + E-mail",
    canExportPDF: false,
    hasPomodoro: true,
    hasClasses: true,
    hasJournal: false,
  },
  [PlanTier.PREMIUM]: {
    maxTasksPerDay: Infinity,
    maxRoutines: Infinity,
    statsHistory: Infinity,
    storage: "Permanente",
    support: "Prioritário WhatsApp",
    canExportPDF: true,
    hasPomodoro: true,
    hasClasses: true,
    hasJournal: true, // Includes auto-evaluation
    hasReports: true,
  },
};

// --- Dashboard (NEW) ---
export type PeriodOption = "Hoje" | "Ontem" | "Semana" | "Mês" | "Sempre";

// types.ts
export const WEEK_DAYS = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sab",
  "Dom",
] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export type WeeklyPoint = {
  day: WeekDay;
  value: number;
};

export interface DashboardMetrics {
  /** % de itens concluídos no período selecionado */
  consistencyPct: number;
  /** micro-passos concluídos (tasks concluídas + steps concluídos) */
  completedItems: number;
  /** micro-passos totais (tasks + steps) */
  totalItems: number;
  /** série para o gráfico de área do resumo semanal */
  weeklyConsistencyData: WeeklyPoint[];
  /** breakdown por “rotinas”/categorias mostrado na listinha da direita */
  breakdown: {
    morning?: number;
    afternoon?: number;
    night?: number;
    [k: string]: number | undefined;
  };
}
