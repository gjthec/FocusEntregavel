import { supabase } from "./supabase";
import { DashboardMetrics, Routine, Task, JournalEntry } from "../types";
import { WEEK_DAYS, WeeklyPoint } from "../types";

function mkPoint(day: (typeof WEEK_DAYS)[number], value: number): WeeklyPoint {
  return { day, value };
}

export const DashboardMetricsService = {
  async fetchMetrics(
    userId: string,
    period: string
  ): Promise<DashboardMetrics> {
    // 1) defina intervalo de datas
    const { from, to } = getRange(period);

    // 2) busque dados puros do Supabase (sem hooks)
    const [tasksRes, routinesRes, journalRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id,status,created_at")
        .eq("user_id", userId)
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString()),
      supabase
        .from("routines")
        .select("id,steps,completed,time,category,frequency")
        .eq("user_id", userId),
      supabase
        .from("journal_entries")
        .select("id,mood,date")
        .eq("user_id", userId)
        .gte("date", from.toISOString())
        .lte("date", to.toISOString()),
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (routinesRes.error) throw routinesRes.error;
    if (journalRes.error) throw journalRes.error;

    const tasks = (tasksRes.data ?? []) as any[];
    const routines = (routinesRes.data ?? []) as Routine[];
    const journal = (journalRes.data ?? []) as JournalEntry[];

    // 3) calcule métricas
    return buildMetrics(tasks, routines, journal, period);
  },
};

function getRange(period: string) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  switch (period) {
    case "Hoje":
      break;
    case "Ontem":
      start.setDate(start.getDate() - 1);
      break;
    case "Semana":
      start.setDate(start.getDate() - 6);
      break;
    case "Mês":
      start.setMonth(start.getMonth() - 1);
      break;
    default: // "Sempre"
      start.setFullYear(2000, 0, 1);
      break;
  }
  return { from: start, to: now };
}

function buildMetrics(
  tasks: any[],
  routines: Routine[],
  journal: JournalEntry[],
  period: string
): DashboardMetrics {
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const totalRoutineSteps = routines.reduce(
    (acc, r) => acc + (r.steps?.length || 1),
    0
  );
  const completedRoutineSteps = routines.reduce((acc, r) => {
    if (r.steps && r.steps.length) {
      return acc + r.steps.filter((s) => (s as any).completed).length;
    }
    return acc + (r.completed ? 1 : 0);
  }, 0);

  const totalItems = tasks.length + totalRoutineSteps;
  const completedItems = completedTasks + completedRoutineSteps;
  const consistencyPct = totalItems
    ? Math.round((completedItems / totalItems) * 100)
    : 0;

  // mock simples para o gráfico semanal (substitua se quiser consolidar por dia)
  // DashboardMetricsService.ts

  // exemplo simples/mock:
  const weeklyConsistencyData: WeeklyPoint[] = [
    mkPoint("Seg", 45),
    mkPoint("Ter", 72),
    mkPoint("Qua", 60),
    mkPoint("Qui", 85),
    mkPoint("Sex", 50),
    mkPoint("Sab", 90),
    mkPoint("Dom", 65),
  ];

  return {
    consistencyPct,
    completedItems,
    totalItems,
    weeklyConsistencyData,
    breakdown: {
      morning: 92,
      afternoon: 45,
      night: 68, // exemplo estático (troque por cálculo real se quiser)
    },
  };
}
