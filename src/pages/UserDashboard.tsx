import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Task,
  Routine,
  RoutineStep,
  PlanTier,
  PLAN_FEATURES,
  TaskStatus,
  JournalEntry,
  MoodType,
} from "../types";
import { AuthService } from "../services/authService";
import { DataService } from "../services/dataService";
import { GeminiService } from "../services/geminiService";
import {
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  Sun,
  FileText,
  TrendingUp,
  Download,
  Play,
  Pause,
  Moon,
  Heart,
  Zap,
  Coffee,
  X,
  ChevronDown,
  ChevronUp,
  Timer,
  Watch,
  Calendar,
  ArrowRight,
  Circle,
  PauseCircle,
  Ban,
  Clock,
  MoreHorizontal,
  Check,
  Loader2,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Smile,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  CartesianGrid,
} from "recharts";

// --- DASHBOARD METRICS (Supabase) ---
import { useDashboardMetrics } from "../hooks/userDashboardMetrics";

// --- CONSTANTS FOR MOOD ---
const MOTIVATIONAL_QUOTES = [
  "Respira. Você não precisa resolver tudo hoje. Um passo já conta.",
  "Você já superou dias difíceis antes. Este também vai passar.",
  "Seu valor não depende de como você está se sentindo agora.",
  "Seja gentil consigo mesmo hoje. Isso já é produtividade.",
  "Tudo bem não estar bem. Cuide de você como cuidaria de alguém que ama.",
  "Você não está atrasado: está seguindo o seu ritmo.",
  "Hoje pode ser um dia ruim, mas você não é um problema.",
  "Descanse. Recarregue. Amanhã você tenta de novo — e isso é coragem.",
  "Seu esforço importa, mesmo quando ninguém vê.",
  "Você importa. Suas emoções importam. Você não está sozinho.",
  "Cada pequeno cuidado consigo já é uma vitória.",
  "Tudo bem pedir menos de si hoje. Você merece descanso.",
  "Seja paciente com sua mente — ela está fazendo o melhor que pode.",
  "O que você sente agora não define quem você é.",
  "Você não precisa ser forte o tempo todo. Só precisa continuar.",
  "Respire fundo. Seu corpo está pedindo calma, não perfeição.",
  "Você não falhou. Está apenas vivendo um momento difícil.",
  "Um pequeno progresso hoje já é o suficiente.",
  "Seu futuro ainda pode ser leve, mesmo que o presente esteja pesado.",
  "Você merece cuidado e tranquilidade — comece por um minuto de gentileza consigo.",
];

// Updated Styles for Dynamic Mood Card (Pastel/Soft Palette)
const MOOD_STYLES: Record<
  string,
  { bg: string; border: string; text: string; emoji: string; label: string }
> = {
  great: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-200 dark:border-teal-800",
    text: "text-teal-700 dark:text-teal-300",
    emoji: "😄",
    label: "Ótimo",
  },
  good: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    emoji: "🙂",
    label: "Bem",
  },
  neutral: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    emoji: "😐",
    label: "Neutro",
  },
  bad: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    emoji: "😞",
    label: "Mal",
  },
  terrible: {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
    emoji: "😣",
    label: "Péssimo",
  },
};

export const UserDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(AuthService.getCurrentUser());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [motivation, setMotivation] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const navigate = useNavigate();

  // Tutorial State
  const [showRoutineTutorial, setShowRoutineTutorial] = useState(false);

  // Tasks UI States
  const [showTaskMenuId, setShowTaskMenuId] = useState<string | null>(null);

  // --- Routine Modal States ---
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [routineTab, setRoutineTab] = useState<
    "create" | "explore" | "generate"
  >("explore");
  const [newRoutine, setNewRoutine] = useState<Partial<Routine>>({
    title: "",
    time: "08:00",
    category: "productivity",
    steps: [],
    frequency: ["Seg", "Ter", "Qua", "Qui", "Sex"],
  });
  const [tempStep, setTempStep] = useState("");

  // Routine Details Modal State
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Generator State
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [userContext, setUserContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Timer State (Integrated) ---
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<"stopwatch" | "timer">(
    "stopwatch"
  );
  const [timeValue, setTimeValue] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<any>(null);

  // --- Mood Modal State ---
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodModalQuote, setMoodModalQuote] = useState("");

  // Routine load indicator
  const [loadingRoutineId, setLoadingRoutineId] = useState<string | null>(null);

  const POMODORO_TIME = 25 * 60;

  // Filtro e métricas do dashboard (AGORA dentro do componente)
  const [periodFilter, setPeriodFilter] = useState<
    "Hoje" | "Ontem" | "Semana" | "Mês" | "Sempre"
  >("Semana");
  const {
    metrics,
    loading: loadingMetrics,
    refresh,
  } = useDashboardMetrics(user?.id ?? null, periodFilter);

  const weeklyConsistencyData = [
    { day: "Seg", value: 45 },
    { day: "Ter", value: 72 },
    { day: "Qua", value: 60 },
    { day: "Qui", value: 85 },
    { day: "Sex", value: 50 },
    { day: "Sab", value: 90 },
    { day: "Dom", value: 65 },
  ];


  // Async Load Data
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const [loadedTasks, loadedRoutines, loadedJournal] =
            await Promise.all([
              DataService.getTasks(user.id),
              DataService.getRoutines(user.id),
              DataService.getJournalEntries(user.id),
            ]);
          setTasks(loadedTasks);
          setRoutines(loadedRoutines);
          setJournalEntries(loadedJournal);
        } catch (error) {
          console.error("Error loading dashboard data:", error);
        }
      }
    };
    loadData();
  }, [user]);

  // --- ROUTINE TUTORIAL LOGIC ---
  useEffect(() => {
    const isDismissed = sessionStorage.getItem(
      "focuspro_routine_tutorial_dismissed"
    );
    if (routines.length === 0 && !isDismissed) {
      const timer = setTimeout(() => setShowRoutineTutorial(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowRoutineTutorial(false);
    }
  }, [routines]);

  const dismissRoutineTutorial = () => {
    setShowRoutineTutorial(false);
    sessionStorage.setItem("focuspro_routine_tutorial_dismissed", "true");
  };

  const openRoutineModalWithTutorial = () => {
    dismissRoutineTutorial();
    openRoutineModal();
  };

  // Check Mood for Popup logic
  useEffect(() => {
    const todayEntry = getTodayEntry();
    if (todayEntry) {
      if (todayEntry.mood === "bad" || todayEntry.mood === "terrible") {
        const todayStr = new Date().toDateString();
        const lastSeen = localStorage.getItem(
          `focuspro_mood_popup_${user?.id}`
        );

        if (lastSeen !== todayStr) {
          const randomQuote =
            MOTIVATIONAL_QUOTES[
              Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
            ];
          setMoodModalQuote(randomQuote);
          setShowMoodModal(true);
          localStorage.setItem(`focuspro_mood_popup_${user?.id}`, todayStr);
        }
      }
    }
  }, [journalEntries]);

  // Timer Interval Logic
  useEffect(() => {
    if (isTimerRunning && activeTaskId) {
      timerRef.current = setInterval(() => {
        setTimeValue((prev) => {
          if (timerMode === "stopwatch") {
            return prev + 1;
          } else {
            if (prev <= 0) {
              setIsTimerRunning(false);
              alert("Tempo esgotado!");
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, activeTaskId, timerMode]);

  const features = user
    ? PLAN_FEATURES[user.plan]
    : PLAN_FEATURES[PlanTier.BASIC];

  const activeTasksCount = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "canceled"
  ).length;

  const totalRoutineSteps = routines.reduce(
    (acc, r) => acc + (r.steps.length || 1),
    0
  );
  const completedRoutineSteps = routines.reduce((acc, r) => {
    const stepsDone = r.steps.filter((s) => s.completed).length;
    return acc + (r.steps.length > 0 ? stepsDone : r.completed ? 1 : 0);
  }, 0);
  const completedTasksCount = tasks.filter(
    (t) => t.status === "completed"
  ).length;

  const totalItems = tasks.length + totalRoutineSteps;
  const completedItems = completedTasksCount + completedRoutineSteps;
  const progressPercentage =
    totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
  const hasProgressCompleted = totalItems > 0 && completedItems === totalItems;

  const routinesLimit = features.maxRoutines;

  const getTodayEntry = () => {
    const today = new Date().toDateString();
    return journalEntries.find(
      (e) => new Date(e.date).toDateString() === today
    );
  };

  const todayEntry = getTodayEntry();
  const hasMoodLogged = !!todayEntry;
  const hasRoutineProgress = routines.some(
    (routine) => routine.completed || routine.steps.some((step) => step.completed)
  );
  const hasWeeklyData =
    (metrics?.weeklySeries?.length ?? 0) > 0 &&
    (metrics?.weeklySeries?.some((item) => item.value > 0) ?? false);
  // MOODS was unused and undefined here, logic uses MOOD_STYLES directly in JSX

  // --- Task Logic ---
  const handleAddTask = async (e?: React.FormEvent, title?: string) => {
    if (e) e.preventDefault();
    const finalTitle = title || newTaskTitle;
    if (!finalTitle.trim() || !user) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: finalTitle,
      status: "pending",
      completed: false,
      createdAt: new Date().toISOString(),
      priority: "medium",
    };

    setTasks((prev) => [newTask, ...prev]); // Optimistic Update
    try {
      await DataService.addTask(newTask);
      refresh();
    } catch (err) {
      console.error("Failed to add task", err);
    }
    if (!title) setNewTaskTitle("");
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = {
      ...task,
      status: newStatus,
      completed: newStatus === "completed",
    };
    setTasks(tasks.map((t) => (t.id === taskId ? updated : t))); // Optimistic

    try {
      await DataService.updateTask(updated);
      refresh();
    } catch (err) {
      console.error("Failed to update task", err);
    }

    if (newStatus === "completed" && activeTaskId === taskId) {
      setIsTimerRunning(false);
      setActiveTaskId(null);
    }
    if (newStatus === "in_progress" && activeTaskId !== taskId) {
      activateTaskFocus(taskId);
    }
    setShowTaskMenuId(null);
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id)); // Optimistic
    try {
      await DataService.deleteTask(id);
      refresh();
    } catch (err) {
      console.error("Failed delete", err);
    }
    if (activeTaskId === id) setActiveTaskId(null);
  };

  // --- Timer UI Logic ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const activateTaskFocus = (taskId: string) => {
    if (activeTaskId === taskId) {
      return;
    }
    setActiveTaskId(taskId);
    setIsTimerRunning(true);
    setTimerMode("stopwatch");
    setTimeValue(0);

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== "in_progress") {
      updateTaskStatus(taskId, "in_progress");
    }
  };

  // --- Routine Logic ---
  const openRoutineModal = () => {
    setNewRoutine({
      title: "",
      time: "08:00",
      category: "productivity",
      steps: [],
      frequency: ["Seg", "Ter", "Qua", "Qui", "Sex"],
    });
    setIsRoutineModalOpen(true);
  };

  const addStepToRoutine = () => {
    if (!tempStep.trim()) return;
    const steps = newRoutine.steps || [];
    setNewRoutine({
      ...newRoutine,
      steps: [
        ...steps,
        { id: crypto.randomUUID(), title: tempStep, completed: false },
      ],
    });
    setTempStep("");
  };

  const removeStepFromRoutine = (idx: number) => {
    const steps = newRoutine.steps || [];
    setNewRoutine({ ...newRoutine, steps: steps.filter((_, i) => i !== idx) });
  };

  const saveRoutine = async () => {
    if (!user || !newRoutine.title) return;
    if (routines.length >= routinesLimit) {
      alert(`Limite de rotinas do plano ${user.plan} atingido.`);
      return;
    }

    const r: Routine = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: newRoutine.title!,
      time: newRoutine.time!,
      category: newRoutine.category as any,
      frequency: newRoutine.frequency!,
      steps: newRoutine.steps || [],
      completed: false,
    };

    setRoutines([...routines, r]); // Optimistic
    setIsRoutineModalOpen(false);

    try {
      await DataService.addRoutine(r);
      refresh();
    } catch (err) {
      console.error("Error saving routine", err);
    }
  };

  const generateRoutines = async () => {
    if (!user) return;

    if (!userContext.trim()) {
      alert("Por favor, descreva um pouco do seu dia a dia.");
      return;
    }

    setIsGenerating(true);

    try {
      const aiRoutines = await GeminiService.generatePersonalizedRoutines(
        wakeTime,
        sleepTime,
        userContext
      );

      if (aiRoutines && Array.isArray(aiRoutines)) {
        const mappedRoutines = aiRoutines.map((r: any) => ({
          id: crypto.randomUUID(),
          userId: user.id,
          title: r.title,
          time: r.time,
          category: r.category || "productivity",
          frequency: r.frequency || ["Seg", "Ter", "Qua", "Qui", "Sex"],
          steps: r.steps || [],
          completed: false,
        }));

        setRoutines([...routines, ...mappedRoutines]);
        setIsRoutineModalOpen(false);

        // Persist generated routines
        for (const r of mappedRoutines) {
          for (const r of mappedRoutines) {
            await DataService.addRoutine(r);
          }
          refresh();
        }
        alert("Rotinas criadas com sucesso pela IA!");
      }
    } catch (error) {
      alert("Erro ao gerar rotinas. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRoutineStep = async (routineId: string, stepId: string) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const newSteps = routine.steps.map((s) =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    const updatedRoutine = { ...routine, steps: newSteps };

    setRoutines(routines.map((r) => (r.id === routineId ? updatedRoutine : r))); // Optimistic
    if (selectedRoutine && selectedRoutine.id === routineId) {
      setSelectedRoutine(updatedRoutine);
    }

    try {
      await DataService.updateRoutine(updatedRoutine);
      refresh();
    } catch (err) {
      console.error("Error updating routine", err);
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!window.confirm("Excluir esta rotina?")) return;
    setRoutines(routines.filter((r) => r.id !== id)); // Optimistic
    setSelectedRoutine(null);
    try {
      await DataService.deleteRoutine(id);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAndSelectRoutine = async (routineId: string) => {
    setLoadingRoutineId(routineId);
    try {
      const latestRoutine = await DataService.getRoutineById(routineId);
      if (latestRoutine) {
        setSelectedRoutine(latestRoutine);
        setRoutines((prev) =>
          prev.map((r) => (r.id === routineId ? latestRoutine : r))
        );
      } else {
        setSelectedRoutine(routines.find((r) => r.id === routineId) || null);
      }
    } catch (error) {
      console.error("Error loading routine details", error);
      setSelectedRoutine(routines.find((r) => r.id === routineId) || null);
    } finally {
      setLoadingRoutineId(null);
    }
  };

  const handleExportReport = () => {
    setExportingReport(true);
    // ... same logic for CSV export ...
    setTimeout(() => setExportingReport(false), 1000);
  };

  // ... Render Helpers (getCategoryIcon, getCategoryLabel, etc. same as before) ...
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "afternoon":
        return <Sun size={18} className="text-orange-500" />; // ou outro ícone
      case "morning":
        return <Sun size={18} className="text-amber-500" />;
      case "night":
        return <Moon size={18} className="text-indigo-500" />;
      case "health":
        return <Heart size={18} className="text-red-500" />;
      case "productivity":
        return <Zap size={18} className="text-blue-500" />;
      case "emotional":
        return <Heart size={18} className="text-pink-500" />;
      default:
        return (
          <Coffee size={18} className="text-slate-500 dark:text-slate-400" />
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "afternoon":
        return "Tarde";
      case "morning":
        return "Manhã";
      case "night":
        return "Noite";
      case "health":
        return "Saúde";
      case "productivity":
        return "Produtividade";
      case "focus":
        return "Foco";
      case "emotional":
        return "Emocional";
      default:
        return "Geral";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans pb-24">
      {/* Header & Progress */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-900 dark:text-white tracking-tight leading-tight">
              Olá, {user?.name.split(" ")[0]}!
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                ✨ Hoje é um ótimo dia para progredir!
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={async () => {
                setLoadingAi(true);
                const txt = await GeminiService.getDailyMotivation(
                  user!.name,
                  activeTasksCount
                );
                setMotivation(txt);
                setLoadingAi(false);
              }}
              disabled={loadingAi}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
            >
              <Sparkles size={16} /> {loadingAi ? "..." : "Motivação IA"}
            </button>

            {features.canExportPDF && (
              <button
                onClick={handleExportReport}
                disabled={exportingReport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
              >
                <FileText size={16} /> Relatório
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 transition-colors border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Progresso do Dia
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {completedItems} de {totalItems} micro-passos
              </span>
            </div>
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {progressPercentage}%
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_2px_10px_rgba(59,130,246,0.3)]"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
            </div>
          </div>
        </div>

        {motivation && (
          <div className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl animate-in fade-in">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} /> "{motivation}"
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. HUMOR CARD */}
        <div className="lg:col-start-3 lg:row-start-1 space-y-6">
          <div
            className={`
                p-5 rounded-2xl shadow-sm border transition-all duration-500 ease-in-out relative
                ${
                  todayEntry && MOOD_STYLES[todayEntry.mood]
                    ? `${MOOD_STYLES[todayEntry.mood].bg} ${
                        MOOD_STYLES[todayEntry.mood].border
                      }`
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`p-2 rounded-lg ${
                  todayEntry
                    ? "bg-white/50 dark:bg-black/10"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}
              >
                <Smile
                  size={20}
                  className={
                    todayEntry && MOOD_STYLES[todayEntry.mood]
                      ? MOOD_STYLES[todayEntry.mood].text
                      : ""
                  }
                />
              </div>
              <div>
                <h3
                  className={`font-bold leading-tight ${
                    todayEntry && MOOD_STYLES[todayEntry.mood]
                      ? MOOD_STYLES[todayEntry.mood].text
                      : "text-slate-800 dark:text-white"
                  }`}
                >
                  Humor de Hoje
                </h3>
                <p
                  className={`text-[10px] uppercase font-bold tracking-wide opacity-70 ${
                    todayEntry && MOOD_STYLES[todayEntry.mood]
                      ? MOOD_STYLES[todayEntry.mood].text
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Diário Emocional
                </p>
              </div>
            </div>

            <div
              className={`
                    rounded-xl p-5 text-center transition-colors
                    ${
                      todayEntry
                        ? "bg-white/40 dark:bg-black/20 border border-white/20"
                        : "bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800"
                    }
                `}
            >
              {todayEntry ? (
                <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                  <div className="text-6xl mb-2 animate-pulse duration-[3000ms] inline-block filter drop-shadow-sm transform hover:scale-110 transition-transform cursor-default">
                    {MOOD_STYLES[todayEntry.mood]?.emoji}
                  </div>
                  <h4
                    className={`text-2xl font-extrabold mb-1 ${
                      MOOD_STYLES[todayEntry.mood]?.text
                    }`}
                  >
                    {MOOD_STYLES[todayEntry.mood]?.label}
                  </h4>
                  <p
                    className={`text-xs mb-4 max-w-[200px] mx-auto leading-relaxed font-medium opacity-80 ${
                      MOOD_STYLES[todayEntry.mood]?.text
                    }`}
                  >
                    Você registrou que está se sentindo assim hoje.
                  </p>
                  <button
                    onClick={() => navigate("/journal")}
                    className={`
                                    text-xs font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-all
                                    bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105
                                `}
                  >
                    Ver Detalhes
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div
                    className="text-5xl mb-3 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer transform hover:scale-110 duration-200"
                    onClick={() => navigate("/journal")}
                  >
                    😶
                  </div>
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Como você está?
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 leading-relaxed max-w-[220px] mx-auto">
                    {journalEntries.length === 0
                      ? "Comece sua jornada de autoconhecimento hoje."
                      : "Registre seu humor para acompanhar padrões."}
                  </p>
                  <button
                    onClick={() => navigate("/journal")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all w-full md:w-auto hover:-translate-y-0.5"
                  >
                    Registrar Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. ROUTINES CARD */}
        <div className="lg:col-span-2 lg:row-start-1 lg:row-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sun size={20} className="text-amber-500" /> Rotinas
              </h3>
              <div className="relative group">
                <button
                  onClick={openRoutineModalWithTutorial}
                  className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Adicionar
                </button>
                {showRoutineTutorial && (
                  <div className="absolute top-full right-0 mt-4 w-56 z-20 animate-in fade-in slide-in-from-top-2 duration-700">
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white dark:bg-slate-700 border-t border-l border-slate-200 dark:border-slate-600 rotate-45 transform shadow-sm"></div>
                    <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-4 rounded-xl shadow-xl relative">
                      <button
                        onClick={dismissRoutineTutorial}
                        className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-xs font-bold text-slate-700 dark:text-white leading-relaxed text-center pr-2">
                        ✨ Clique aqui para criar sua rotina personalizada!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {routines.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                  Sem rotinas ativas.
                </p>
              )}

              {routines.map((routine) => {
                const stepsDone = routine.steps.filter(
                  (s) => s.completed
                ).length;
                const stepsTotal = routine.steps.length;
                const routineProgress =
                  stepsTotal > 0
                    ? Math.round((stepsDone / stepsTotal) * 100)
                    : routine.completed
                    ? 100
                    : 0;

                return (
                  <div
                    key={routine.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div
                      className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => fetchAndSelectRoutine(routine.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                          {getCategoryIcon(routine.category)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                            {routine.title}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{routine.time}</span>
                            <span>•</span>
                            <span
                              className={`${
                                routineProgress === 100
                                  ? "text-green-500 font-bold"
                                  : ""
                              }`}
                            >
                              {routineProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {loadingRoutineId === routine.id ? (
                        <Loader2
                          className="animate-spin text-blue-500"
                          size={16}
                        />
                      ) : (
                        <ArrowRight
                          size={16}
                          className="text-slate-300 dark:text-slate-600"
                        />
                      )}
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className={`h-full ${
                          routineProgress === 100
                            ? "bg-green-500"
                            : "bg-blue-500"
                        } transition-all`}
                        style={{ width: `${routineProgress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. WEEKLY SUMMARY CARD */}
        <div className="lg:col-start-3 lg:row-start-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all relative hover:shadow-xl duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600"></div>
            <div className="p-6 pb-2 flex justify-between items-center mt-2">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                  <TrendingUp size={20} />
                </div>
                <span className="text-lg">Resumo</span>
              </h3>
              <div className="relative group">
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option>Hoje</option>
                  <option>Ontem</option>
                  <option>Semana</option>
                  <option>Mês</option>
                  <option>Sempre</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="p-6 pt-4">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Consistência da Semana
                  </p>
                  <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 tracking-tight">
                    {loadingMetrics
                      ? "…"
                      : `${metrics?.consistencyPercent ?? 0}%`}
                  </h2>
                </div>
              </div>

              <div className="h-56 w-full mb-8 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      (metrics?.weeklySeries?.length ?? 0) > 0
                        ? metrics!.weeklySeries
                        : [
                            { day: "Seg", value: 0 },
                            { day: "Ter", value: 0 },
                            { day: "Qua", value: 0 },
                            { day: "Qui", value: 0 },
                            { day: "Sex", value: 0 },
                            { day: "Sab", value: 0 },
                            { day: "Dom", value: 0 },
                          ]
                    }
                  >
                    <defs>
                      <linearGradient
                        id="strokeGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#2563eb" />
                        <stop offset="100%" stopColor="#9333ea" />
                      </linearGradient>
                      <linearGradient
                        id="fillGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="90%"
                          stopColor="#9333ea"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      className="dark:opacity-10"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                      dy={10}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                        padding: "12px",
                      }}
                      itemStyle={{ color: "#3b82f6", fontWeight: "bold" }}
                      cursor={{
                        stroke: "#cbd5e1",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="url(#strokeGradient)"
                      strokeWidth={4}
                      fill="url(#fillGradient)"
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        stroke: "#fff",
                        fill: "#9333ea",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <Target size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-green-500 flex items-center">
                      <ArrowUpRight size={10} /> +12%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white">
                    {completedItems}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Micro-passos
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <Activity size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400">
                      Med
                    </span>
                  </div>
                  <div className="text-xl font-bold text-slate-800 dark:text-white">
                    {loadingMetrics
                      ? "…"
                      : `${Math.round(metrics?.dailyAverage ?? 0)}/dia`}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Média Diária
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Rotina
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Status
                  </span>
                </div>

                <div className="space-y-1">
                  {[
                    { key: "morning", label: "Rotina Matinal" },
                    { key: "afternoon", label: "Rotina da Tarde" },
                    { key: "night", label: "Rotina da Noite" },
                  ].map(({ key, label }) => {
                    const percent =
                      metrics?.routineByCat?.[
                        key as "morning" | "afternoon" | "night"
                      ] ?? 0;
                    const color =
                      percent >= 80
                        ? "text-green-500"
                        : percent >= 50
                        ? "text-amber-500"
                        : "text-blue-500";

                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {label}
                        </div>
                        <div className={`text-xs font-bold ${color}`}>
                          {percent}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS (Mood, Detail, Add Routine) --- */}
      {/* Kept largely same structure but functions updated above */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <div className="mb-6 mt-2 relative">
              <div className="text-6xl animate-[bounce_3s_infinite]">💙</div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Ei, respira um pouco...
            </h2>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-2xl mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">
                "{moodModalQuote}"
              </p>
            </div>
            <button
              onClick={() => setShowMoodModal(false)}
              className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-base font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-lg"
            >
              Ok, obrigado
            </button>
          </div>
        </div>
      )}

      {selectedRoutine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 h-fit">
                  {getCategoryIcon(selectedRoutine.category)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedRoutine.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                      {getCategoryLabel(selectedRoutine.category)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Watch size={10} /> {selectedRoutine.time}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoutine(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Frequência
                </label>
                <div className="flex flex-wrap gap-1">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(
                    (d) => (
                      <span
                        key={d}
                        className={`text-xs px-2 py-1 rounded ${
                          selectedRoutine.frequency.includes(d)
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {d}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Progresso</span>
                  <span>
                    {selectedRoutine.steps.filter((s) => s.completed).length}/
                    {selectedRoutine.steps.length || 1}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{
                      width: `${
                        (selectedRoutine.steps.filter((s) => s.completed)
                          .length /
                          (selectedRoutine.steps.length || 1)) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Micro-tarefas
                </label>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl">
                  {selectedRoutine.steps.length === 0 && (
                    <span className="text-sm text-slate-400 italic">
                      Apenas marcar como concluída.
                    </span>
                  )}
                  {selectedRoutine.steps.map((step) => (
                    <div
                      key={step.id}
                      onClick={() =>
                        toggleRoutineStep(selectedRoutine.id, step.id)
                      }
                      className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          step.completed
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {step.completed && <CheckCircle2 size={12} />}
                      </div>
                      <span
                        className={`text-sm ${
                          step.completed
                            ? "line-through text-slate-400"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                <button
                  onClick={() => deleteRoutine(selectedRoutine.id)}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={16} /> Excluir Rotina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRoutineModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Gerenciar Rotinas
              </h2>
              <button
                onClick={() => setIsRoutineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setRoutineTab("explore")}
                className={`flex-1 py-4 text-sm font-bold border-b-2 ${
                  routineTab === "explore"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }`}
              >
                Explorar
              </button>
              <button
                onClick={() => setRoutineTab("generate")}
                className={`flex-1 py-4 text-sm font-bold border-b-2 ${
                  routineTab === "generate"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }`}
              >
                Gerador IA
              </button>
              <button
                onClick={() => setRoutineTab("create")}
                className={`flex-1 py-4 text-sm font-bold border-b-2 ${
                  routineTab === "create"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 dark:text-slate-400"
                }`}
              >
                Criar Manual
              </button>
            </div>

            <div className="p-6 text-slate-700 dark:text-slate-300">
              {routineTab === "explore" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      t: "Rotina Matinal",
                      cat: "morning",
                      items: [
                        "Beber água",
                        "Arrumar cama",
                        "Sem celular 15min",
                      ],
                    },
                    {
                      t: "Foco Profundo",
                      cat: "focus",
                      items: ["Celular longe", "Timer 50min", "Uma meta clara"],
                    },
                    {
                      t: "Higiene do Sono",
                      cat: "night",
                      items: ["Banho morno", "Ler livro", "Desligar telas"],
                    },
                    {
                      t: "Bem-estar Emocional",
                      cat: "emotional",
                      items: [
                        "Diário de gratidão",
                        "Meditação 5min",
                        "Respiração",
                      ],
                    },
                  ].map((preset, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-400 cursor-pointer transition-all group"
                      onClick={() => {
                        setNewRoutine({
                          title: preset.t,
                          category: preset.cat as any,
                          time: preset.cat === "morning" ? "07:00" : "20:00",
                          frequency: ["Seg", "Ter", "Qua", "Qui", "Sex"],
                          steps: preset.items.map((txt) => ({
                            id: Math.random().toString(),
                            title: txt,
                            completed: false,
                          })),
                        });
                        setRoutineTab("create");
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(preset.cat)}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {preset.t}
                        </span>
                      </div>
                      <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside">
                        {preset.items.map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                      <div className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Usar este modelo →
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {routineTab === "generate" && (
                <div className="space-y-6 text-center">
                  <Sparkles size={48} className="mx-auto text-blue-500 mb-2" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Gerador Inteligente de Rotinas
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                    A IA cria rotinas personalizadas baseadas no seu contexto.
                  </p>

                  <div className="space-y-4 max-w-sm mx-auto text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Acordo às
                        </label>
                        <input
                          type="time"
                          value={wakeTime}
                          onChange={(e) => setWakeTime(e.target.value)}
                          className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Durmo às
                        </label>
                        <input
                          type="time"
                          value={sleepTime}
                          onChange={(e) => setSleepTime(e.target.value)}
                          className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Descreva seu dia a dia
                      </label>
                      <textarea
                        value={userContext}
                        onChange={(e) => setUserContext(e.target.value)}
                        placeholder="Ex: Trabalho de casa, tenho dois filhos, gosto de treinar pela manhã..."
                        className="w-full mt-1 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm h-24 resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateRoutines}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Sparkles size={20} />
                    )}
                    {isGenerating ? "Criando Rotinas..." : "Gerar com IA"}
                  </button>
                </div>
              )}

              {routineTab === "create" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Nome da Rotina
                    </label>
                    <input
                      type="text"
                      value={newRoutine.title}
                      onChange={(e) =>
                        setNewRoutine({ ...newRoutine, title: e.target.value })
                      }
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="Ex: Ritual da Manhã"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Horário
                      </label>
                      <input
                        type="time"
                        value={newRoutine.time}
                        onChange={(e) =>
                          setNewRoutine({ ...newRoutine, time: e.target.value })
                        }
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Categoria
                      </label>
                      <select
                        value={newRoutine.category}
                        onChange={(e) =>
                          setNewRoutine({
                            ...newRoutine,
                            category: e.target.value as any,
                          })
                        }
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                      >
                        <option value="morning">Manhã</option>
                        <option value="afternoon">Tarde</option>
                        <option value="night">Noite</option>
                        <option value="health">Saúde</option>
                        <option value="productivity">Produtividade</option>
                        <option value="focus">Foco</option>
                        <option value="emotional">Emocional</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Frequência
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(
                        (day) => (
                          <button
                            key={day}
                            onClick={() => {
                              const freq = newRoutine.frequency || [];
                              if (freq.includes(day))
                                setNewRoutine({
                                  ...newRoutine,
                                  frequency: freq.filter((d) => d !== day),
                                });
                              else
                                setNewRoutine({
                                  ...newRoutine,
                                  frequency: [...freq, day],
                                });
                            }}
                            className={`text-xs px-3 py-1 rounded-full border ${
                              newRoutine.frequency?.includes(day)
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {day}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Micro-tarefas (Passo a passo)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempStep}
                        onChange={(e) => setTempStep(e.target.value)}
                        placeholder="Adicionar passo..."
                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                        onKeyDown={(e) =>
                          e.key === "Enter" && addStepToRoutine()
                        }
                      />
                      <button
                        onClick={addStepToRoutine}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                      >
                        <Plus />
                      </button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {newRoutine.steps?.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-2 rounded text-sm"
                        >
                          <span>
                            {idx + 1}. {step.title}
                          </span>
                          <button
                            onClick={() => removeStepFromRoutine(idx)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {(!newRoutine.steps || newRoutine.steps.length === 0) && (
                        <p className="text-xs text-slate-400 italic">
                          Nenhum passo adicionado.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={saveRoutine}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Salvar Rotina
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
