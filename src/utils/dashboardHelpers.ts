// src/utils/dashboardHelpers.ts
// Ajuste o caminho abaixo se seu supabase.ts estiver em outro diretório
import { supabase } from "../services/supabase";

export type WeeklyPoint = { day: string; value: number };
export type RoutineStat = { name: string; percent: number };

export type DashboardMetrics = {
  consistencyPercent: number;
  dailyAverage: number;
  weeklySeries: WeeklyPoint[];
  routineStats: RoutineStat[];
};

export const weekdayLabels = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export function getPeriodRange(filter: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (filter === "Hoje") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "Ontem") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "Semana") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "Mês") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    // Sempre
    start.setFullYear(2000, 0, 1);
    start.setHours(0, 0, 0, 0);
    end.setFullYear(2100, 0, 1);
    end.setHours(23, 59, 59, 999);
  }

  return {
    fromISO: start.toISOString(),
    toISO: end.toISOString(),
    from: start,
    to: end,
  };
}

export const dayKey = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Calcula métricas do dashboard usando SOMENTE:
 * - tasks
 * - routines
 * - journal_entries
 *
 * Regras:
 * - Consistência: % de dias no período com ≥ 1 micro-passo (task concluída, rotina concluída no dia ou journal do dia)
 * - Série semanal: para cada dia no período, value = min(100, microPassos*10)
 * - Média diária: média de micro-passos/dia no período
 * - Rotina Matinal/Tarde/Noite: média do % de conclusão por rotina (steps concluídos / total) por categoria
 */
export async function fetchDashboardMetrics(
  userId: string,
  periodFilter: string
): Promise<DashboardMetrics> {
  const { fromISO, toISO, from, to } = getPeriodRange(periodFilter);

  // ---------- TASKS ----------
  const { data: tasksRows, error: tasksErr } = await supabase
    .from("tasks")
    .select("status, created_at, updated_at, completed")
    .eq("user_id", userId)
    .gte("coalesce(updated_at, created_at)", fromISO)
    .lte("coalesce(updated_at, created_at)", toISO);

  if (tasksErr) console.error("tasks error:", tasksErr);

  const taskDoneByDay: Record<string, number> = {};
  (tasksRows ?? [])
    .filter((t: any) => t.status === "completed" || t.completed === true)
    .forEach((t: any) => {
      const when = new Date((t.updated_at ?? t.created_at) as string);
      const k = dayKey(when);
      taskDoneByDay[k] = (taskDoneByDay[k] ?? 0) + 1;
    });

  // ---------- JOURNAL ----------
  const { data: journals, error: jErr } = await supabase
    .from("journal_entries")
    .select("date, created_at")
    .eq("user_id", userId)
    .gte("coalesce(date, created_at)", fromISO)
    .lte("coalesce(date, created_at)", toISO);

  if (jErr) console.error("journal error:", jErr);

  const journalByDay: Record<string, number> = {};
  (journals ?? []).forEach((j: any) => {
    const raw = j.date ?? j.created_at;
    const d = new Date(raw as string);
    const k = dayKey(d);
    journalByDay[k] = (journalByDay[k] ?? 0) + 1;
  });

  // ---------- ROUTINES ----------
  const { data: routinesRows, error: rErr } = await supabase
    .from("routines")
    .select("title, category, steps, completed, updated_at, created_at")
    .eq("user_id", userId)
    .gte("coalesce(updated_at, created_at)", fromISO)
    .lte("coalesce(updated_at, created_at)", toISO);

  if (rErr) console.error("routines error:", rErr);

  const routinePercent = (r: any): number => {
    if (Array.isArray(r?.steps) && r.steps.length > 0) {
      const done = r.steps.filter((s: any) => s?.completed).length;
      return Math.round((done / r.steps.length) * 100);
    }
    return r?.completed ? 100 : 0;
  };

  const isMorning = (r: any) =>
    r.category === "morning" || /matin/i.test(r.title ?? "");
  const isAfternoon = (r: any) =>
    r.category === "afternoon" || /tarde/i.test(r.title ?? "");
  const isNight = (r: any) =>
    r.category === "night" || /noite/i.test(r.title ?? "");

  const avgFor = (pred: (r: any) => boolean) => {
    const list = (routinesRows ?? []).filter(pred);
    if (list.length === 0) return 0;
    const sum = list.reduce(
      (acc: number, r: any) => acc + routinePercent(r),
      0
    );
    return Math.round(sum / list.length);
  };

  const routineStats: RoutineStat[] = [
    { name: "Rotina Matinal", percent: avgFor(isMorning) },
    { name: "Rotina da Tarde", percent: avgFor(isAfternoon) },
    { name: "Rotina da Noite", percent: avgFor(isNight) },
  ];

  // Rotinas concluídas por dia contam 1 micro-passo
  const routineByDay: Record<string, number> = {};
  (routinesRows ?? [])
    .filter((r: any) => r.completed === true)
    .forEach((r: any) => {
      const raw = r.updated_at ?? r.created_at;
      const d = new Date(raw as string);
      const k = dayKey(d);
      routineByDay[k] = (routineByDay[k] ?? 0) + 1;
    });

  // ---------- AGREGAÇÃO ----------
  const days: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const perDayCounts: number[] = days.map((d) => {
    const k = dayKey(d);
    const cTasks = taskDoneByDay[k] ?? 0;
    const cRoutines = routineByDay[k] ?? 0;
    const cJournal = journalByDay[k] ?? 0;
    return cTasks + cRoutines + cJournal;
  });

  // Série (0–100): 1 micro-passo = +10 pts (cap 100)
  const weeklySeries: WeeklyPoint[] = days.map((d, i) => ({
    day: weekdayLabels[d.getDay()],
    value: Math.min(100, (perDayCounts[i] || 0) * 10),
  }));

  // Consistência: % de dias com ≥ 1 micro-passo
  const totalDays = Math.max(1, days.length);
  const consistentDays = perDayCounts.filter((c) => c > 0).length;
  const consistencyPercent = Math.round((consistentDays / totalDays) * 100);

  // Média diária de micro-passos
  const total = perDayCounts.reduce((a, b) => a + b, 0);
  const dailyAverage = Math.round((total / totalDays) * 100) / 100;

  return { consistencyPercent, dailyAverage, weeklySeries, routineStats };
}
