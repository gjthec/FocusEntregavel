import { useEffect, useMemo, useState } from "react";
import { DataService } from "../services/dataService";
import { Task, Routine } from "../types";
import { supabase } from "../services/supabase";

type Period = "Hoje" | "Ontem" | "Semana" | "Mês" | "Sempre";

const TZ = "America/Sao_Paulo";
const MS_DAY = 86400000;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
};

function resolveRange(period: Period) {
  const now = new Date();
  const today = startOfDay(now);
  switch (period) {
    case "Hoje":
      return { start: today, end: addDays(today, 1), daysWindow: 1 };
    case "Ontem":
      return { start: addDays(today, -1), end: today, daysWindow: 1 };
    case "Semana": {
      // segunda-feira como início
      const dow = (today.getDay() + 6) % 7;
      const start = addDays(today, -dow);
      return { start, end: addDays(start, 7), daysWindow: 7 };
    }
    case "Mês": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const daysWindow = Math.round((+end - +start) / MS_DAY);
      return { start, end, daysWindow };
    }
    case "Sempre":
    default:
      return { start: new Date(0), end: addDays(today, 1), daysWindow: 30 };
  }
}

export function useDashboardMetrics(userId: string | null, period: Period) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [version, setVersion] = useState(0); // força recomputar/fetch

  const refresh = () => setVersion((v) => v + 1);

  // Fetch inicial e sempre que mudar período/usuário/refresh
  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!userId) {
        if (mounted) {
          setTasks([]);
          setRoutines([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const [t, r] = await Promise.all([
          DataService.getTasks(userId),
          DataService.getRoutines(userId),
        ]);
        if (!mounted) return;
        setTasks(t || []);
        setRoutines(r || []);
      } catch (e) {
        console.error("useDashboardMetrics fetch error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [userId, period, version]);

  // Evento global opcional: dispare window.dispatchEvent(new Event("focuspro:data-changed"))
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("focuspro:data-changed", handler);
    return () => window.removeEventListener("focuspro:data-changed", handler);
  }, []);

  // Realtime do Supabase: qualquer mudança em tasks/routines do usuário força refresh
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dashboard_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "routines",
          filter: `user_id=eq.${userId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const metrics = useMemo(() => {
    const { start, end, daysWindow } = resolveRange(period);

    const inRange = (iso?: string) => {
      if (!iso) return true; // sem data: considera
      const d = new Date(iso);
      return d >= start && d < end;
    };

    // --- Tarefas ---
    const tasksIn = tasks.filter((t) => inRange(t.createdAt));
    const totalTaskItems = tasksIn.length;
    const completedTasks = tasksIn.filter(
      (t) => t.status === "completed"
    ).length;

    // --- Rotinas (sempre contamos todas para o período) ---
    let routineStepsTotal = 0;
    let routineStepsDone = 0;

    let morningDone = 0,
      morningTotal = 0;
    let afternoonDone = 0,
      afternoonTotal = 0;
    let nightDone = 0,
      nightTotal = 0;

    (routines || []).forEach((r) => {
      const steps = r.steps ?? [];
      const total = steps.length || 1;
      const done =
        steps.length > 0
          ? steps.filter((s) => s.completed).length
          : r.completed
          ? 1
          : 0;

      routineStepsTotal += total;
      routineStepsDone += done;

      const cat = (r.category || "").toLowerCase();
      if (cat === "morning") {
        morningTotal += total;
        morningDone += done;
      } else if (cat === "afternoon") {
        afternoonTotal += total;
        afternoonDone += done;
      } else if (cat === "night") {
        nightTotal += total;
        nightDone += done;
      }
    });

    const totalItems = totalTaskItems + routineStepsTotal;
    const doneItems = completedTasks + routineStepsDone;

    const consistencyPercent =
      totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    const dailyAverage = daysWindow > 0 ? doneItems / daysWindow : 0;

    // Série semanal (Seg..Dom) com tarefas concluídas por dia
    const baseMonday = (() => {
      const today = startOfDay(new Date());
      const dow = (today.getDay() + 6) % 7; // 0=Mon
      return addDays(today, -dow);
    })();

    const dayLabel = (d: Date) =>
      d
        .toLocaleDateString("pt-BR", { weekday: "short", timeZone: TZ })
        .replace(".", "")
        .slice(0, 3)
        .replace(/^seg$/i, "Seg")
        .replace(/^ter$/i, "Ter")
        .replace(/^qua$/i, "Qua")
        .replace(/^qui$/i, "Qui")
        .replace(/^sex$/i, "Sex")
        .replace(/^sáb$/i, "Sab")
        .replace(/^dom$/i, "Dom");

    const weeklySeries: { day: string; value: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = addDays(baseMonday, i);
      const dayEnd = addDays(dayStart, 1);
      const inDay = (iso?: string) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d >= dayStart && d < dayEnd;
      };
      const tasksDoneDay = tasks.filter(
        (t) => inDay(t.updatedAt || t.createdAt) && t.status === "completed"
      ).length;
      weeklySeries.push({ day: dayLabel(dayStart), value: tasksDoneDay });
    }

    const morningPercent = morningTotal
      ? Math.round((morningDone / morningTotal) * 100)
      : 0;
    const afternoonPercent = afternoonTotal
      ? Math.round((afternoonDone / afternoonTotal) * 100)
      : 0;
    const nightPercent = nightTotal
      ? Math.round((nightDone / nightTotal) * 100)
      : 0;

    return {
      consistencyPercent,
      dailyAverage,
      weeklySeries,
      routineStats: [
        { label: "Rotina Matinal", percent: morningPercent },
        { label: "Rotina da Tarde", percent: afternoonPercent },
        { label: "Rotina da Noite", percent: nightPercent },
      ],
      // acesso direto por categoria, se precisar
      routineByCat: {
        morning: morningPercent,
        afternoon: afternoonPercent,
        night: nightPercent,
      },
    };
  }, [tasks, routines, period]);

  return { metrics, loading, refresh };
}
