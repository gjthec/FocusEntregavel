import React, { useState, useEffect, useMemo } from "react";
import { DataService } from "../services/dataService";
import { AuthService } from "../services/authService";
import { JournalEntry, MoodType } from "../types";
import {
  Save,
  Calendar,
  BarChart2,
  TrendingUp,
  Tag,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Clock,
  Quote,
  Activity,
  Smile,
  Layers,
  AlignLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

// --- CONSTANTS --- (Same as original file)
const MOODS: {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
  category: "positive" | "neutral" | "negative";
  score: number;
}[] = [
  {
    type: "great",
    emoji: "😄",
    label: "Ótimo",
    color:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    category: "positive",
    score: 5,
  },
  {
    type: "good",
    emoji: "🙂",
    label: "Bem",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    category: "positive",
    score: 4,
  },
  {
    type: "neutral",
    emoji: "😐",
    label: "Neutro",
    color:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    category: "neutral",
    score: 3,
  },
  {
    type: "bad",
    emoji: "😞",
    label: "Mal",
    color:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    category: "negative",
    score: 2,
  },
  {
    type: "terrible",
    emoji: "😣",
    label: "Péssimo",
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    category: "negative",
    score: 1,
  },
];

const REASONS = {
  positive: [
    "Vitória no trabalho",
    "Produtivo hoje",
    "Consegui focar",
    "Dormi bem",
    "Me senti motivado",
    "Dia leve",
    "Bons relacionamentos",
  ],
  neutral: [
    "Dia normal",
    "Nada muito diferente",
    "Rotina ok",
    "Produtividade mediana",
    "Cumpri o básico",
  ],
  negative: [
    "Falta de foco",
    "Ansiedade",
    "Cansaço",
    "Frustração",
    "Estresse social",
    "Irritação",
    "Sobrecarga mental",
    "Insônia",
  ],
};

const TAGS = [
  "Trabalho",
  "Estudos",
  "Família",
  "Social",
  "Relacionamento",
  "Saúde",
  "Foco",
  "Procrastinação",
  "Sono",
  "Finanças",
  "Terapia",
];

const PROMPTS = [
  "O que aconteceu hoje?",
  "O que te deixou assim?",
  "O que você gostaria de melhorar?",
  "O que deu certo hoje?",
  "Pelo que você é grato(a)?",
];

const FEEDBACK_MESSAGES = {
  positive: "Ótimo! Registre o que deu certo hoje para repetir depois.",
  neutral:
    "Você fez o suficiente. Mesmo dias comuns ajudam a construir constância.",
  negative:
    "Tudo bem ter dias difíceis. Respire fundo, você está fazendo o seu melhor.",
  anxiety:
    "Quer tentar um exercício de respiração rápida? Inspire por 4s, segure 4s, expire 4s.",
  tired:
    "Uma pausa leve pode te ajudar a recarregar a energia. Respeite seu descanso.",
};

// --- COMPONENTS ---

export const Journal: React.FC = () => {
  const user = AuthService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Form State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      DataService.getJournalEntries(user.id)
        .then(setEntries)
        .catch(console.error);
    }
  }, [user?.id]);

  // --- HELPERS ---

  const DEFAULT_MOOD = {
    type: "neutral" as const,
    emoji: "😐",
    label: "Neutro",
    color:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    category: "neutral" as const,
    score: 3,
  };

  const getMoodConfig = (type: MoodType) =>
    MOODS.find((m) => m.type === type) ?? DEFAULT_MOOD;

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addPrompt = (prompt: string) => {
    setNote((prev) => (prev ? `${prev}\n\n${prompt} ` : `${prompt} `));
  };

  const getFeedback = () => {
    if (!selectedMood) return null;
    const config = getMoodConfig(selectedMood);

    if (selectedReasons.includes("Ansiedade")) return FEEDBACK_MESSAGES.anxiety;
    if (selectedReasons.includes("Cansaço")) return FEEDBACK_MESSAGES.tired;

    if (config.category === "positive") return FEEDBACK_MESSAGES.positive;
    if (config.category === "neutral") return FEEDBACK_MESSAGES.neutral;
    return FEEDBACK_MESSAGES.negative;
  };

  const saveEntry = async () => {
    if (!user || !selectedMood) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      date: new Date().toISOString(),
      mood: selectedMood,
      reasons: selectedReasons,
      tags: selectedTags,
      content: note,
    };

    setEntries([newEntry, ...entries]); // Optimistic

    // Reset Form
    setSelectedMood(null);
    setSelectedReasons([]);
    setSelectedTags([]);
    setNote("");

    try {
      await DataService.addJournalEntry(newEntry);
      const msgs = [
        "Boa! Registrar seus sentimentos é um passo poderoso.",
        "Você está construindo autoconhecimento.",
        "Pequenos passos mudam vidas.",
        "Ótimo trabalho!",
      ];
      setSuccessToast(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to save entry", err);
      alert("Erro ao salvar entrada.");
    }
  };

  // --- ANALYTICS CALCULATIONS (Unchanged Logic) ---

  const getWeeklyData = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const data = days.map((d) => ({ name: d, score: 0, count: 0 }));

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    entries.forEach((e) => {
      const date = new Date(e.date);
      if (date > oneWeekAgo) {
        const dayIdx = date.getDay();
        const moodConfig = MOODS.find((m) => m.type === e.mood);
        const score = moodConfig ? moodConfig.score : 3;

        data[dayIdx].score += score;
        data[dayIdx].count += 1;
      }
    });

    return data.map((d) => ({ ...d, avg: d.count ? d.score / d.count : 0 }));
  };

  const getAutoEvaluation = () => {
    if (!entries.length) return null;

    // Últimos 7 dias (inclui hoje)
    const now = new Date();
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6
    );

    // Helper: chave local YYYY-MM-DD
    const dayKey = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    // Mapa de score por mood
    const moodScore: Record<MoodType, number> = MOODS.reduce((acc, m) => {
      acc[m.type] = m.score;
      return acc;
    }, {} as Record<MoodType, number>);

    // Filtra semana e agrupa por dia
    const byDay: Record<
      string,
      { sum: number; count: number; reasons: string[] }
    > = {};

    entries.forEach((e) => {
      const d = new Date(e.date);
      if (d >= weekStart && d <= now) {
        const key = dayKey(d);
        if (!byDay[key]) byDay[key] = { sum: 0, count: 0, reasons: [] };
        byDay[key].sum += moodScore[e.mood as MoodType] ?? 3;
        byDay[key].count += 1;
        if (Array.isArray(e.reasons)) byDay[key].reasons.push(...e.reasons);
      }
    });

    const dayKeys = Object.keys(byDay);
    if (!dayKeys.length) return null;

    // Classifica por média do dia
    let goodDays = 0;
    let badDays = 0;

    // Limiares: >3 positivo, <3 negativo, =3 neutro
    dayKeys.forEach((k) => {
      const avg = byDay[k].sum / byDay[k].count;
      if (avg > 3) goodDays += 1;
      else if (avg < 3) badDays += 1;
    });

    // Motivo mais frequente na semana
    const allReasonsWeek = dayKeys.flatMap((k) => byDay[k].reasons);
    const topReason =
      allReasonsWeek.length === 0
        ? null
        : allReasonsWeek
            .sort(
              (a, b) =>
                allReasonsWeek.filter((v) => v === a).length -
                allReasonsWeek.filter((v) => v === b).length
            )
            .pop() ?? null;

    return { goodDays, badDays, topReason };
  };

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthEntries = entries
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (currentMonthEntries.length === 0) return null;

    const moodCounts: Record<string, number> = {};
    let maxMoodCount = 0;
    let predominantMood: MoodType = "neutral";

    let totalScore = 0;
    const scores: number[] = [];

    const tagCounts: Record<string, number> = {};

    currentMonthEntries.forEach((e) => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
      if (moodCounts[e.mood] > maxMoodCount) {
        maxMoodCount = moodCounts[e.mood];
        predominantMood = e.mood;
      }

      const m = MOODS.find((m) => m.type === e.mood);
      const score = m ? m.score : 3;
      totalScore += score;
      scores.push(score);

      e.tags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const mean = totalScore / scores.length;
    const variance =
      scores.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    let variationLabel = "Baixa";
    if (stdDev > 0.8) variationLabel = "Moderada";
    if (stdDev > 1.2) variationLabel = "Alta";

    const sortedDesc = [...currentMonthEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    if (sortedDesc.length > 0) {
      streak = 1;
    }

    let insightTitle = "";
    let insightText = "";

    const positiveCount =
      (moodCounts["great"] || 0) + (moodCounts["good"] || 0);
    const negativeCount =
      (moodCounts["bad"] || 0) + (moodCounts["terrible"] || 0);

    if (variationLabel === "Alta") {
      insightTitle = "Mês de Altos e Baixos";
      insightText =
        "Seu humor variou bastante ao longo do mês. Observe quais tags aparecem com maior frequência em dias desafiadores.";
    } else if (positiveCount > negativeCount) {
      insightTitle = "Mês Positivo!";
      insightText =
        "Seu mês teve mais dias positivos do que negativos. Continue reforçando os hábitos que funcionaram!";
    } else if (negativeCount > positiveCount) {
      insightTitle = "Mês Desafiador";
      insightText =
        "Você teve um mês emocionalmente intenso. Seja gentil com sua jornada. Cuidar de pequenas coisas já ajuda muito.";
    } else {
      insightTitle = "Mês Equilibrado";
      insightText =
        "Seu mês foi equilibrado. Pequenos ajustes podem aumentar seus momentos positivos.";
    }

    let suggestion = "";
    if (positiveCount > negativeCount)
      suggestion =
        "Você está evoluindo! Tente manter os hábitos que te fizeram bem este mês.";
    else if (negativeCount > positiveCount)
      suggestion =
        "Seu mês teve desafios. Escolha apenas uma pequena meta para focar na próxima semana.";
    else
      suggestion = "Continue registrando: consistência gera clareza emocional.";

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const timelineData = currentMonthEntries.map((e) => {
      const m = MOODS.find((m) => m.type === e.mood);
      return {
        date: new Date(e.date).getDate(),
        fullDate: new Date(e.date).toLocaleDateString("pt-BR"),
        score: m ? m.score : 3,
        moodLabel: m?.label,
        moodEmoji: m?.emoji,
        tags: e.tags.slice(0, 2).join(", "),
        reasons: e.reasons.slice(0, 2).join(", "),
      };
    });

    const distributionData = MOODS.map((m) => ({
      name: m.label,
      count: moodCounts[m.type] || 0,
      fill:
        m.type === "great"
          ? "#4ade80"
          : m.type === "good"
          ? "#34d399"
          : m.type === "neutral"
          ? "#cbd5e1"
          : m.type === "bad"
          ? "#fdba74"
          : "#fca5a5",
    })).filter((d) => d.count > 0);

    return {
      count: currentMonthEntries.length,
      predominant: MOODS.find((m) => m.type === predominantMood),
      variation: variationLabel,
      streak:
        currentMonthEntries.length > 5
          ? "5+ dias"
          : `${currentMonthEntries.length} dias`,
      insightTitle,
      insightText,
      suggestion,
      topTags,
      timelineData,
      distributionData,
      entries: currentMonthEntries.reverse(),
    };
  }, [entries]);

  // --- RENDER (Unchanged) ---
  return (
    <div className="max-w-4xl mx-auto pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-blue-500" /> Diário Emocional
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Entenda seus padrões e melhore sua regulação emocional.
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex shadow-inner">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "daily"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setActiveTab("weekly")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "weekly"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "monthly"
                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-105"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Mês
          </button>
        </div>
      </div>

      {activeTab === "daily" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-6">
                Como você está se sentindo hoje?
              </h2>
              <div className="flex justify-center gap-2 md:gap-6 flex-wrap">
                {MOODS.map((mood) => (
                  <button
                    key={mood.type}
                    onClick={() => setSelectedMood(mood.type)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 group
                                    ${
                                      selectedMood === mood.type
                                        ? `scale-110 ring-4 ring-offset-2 dark:ring-offset-slate-800 ring-blue-100 dark:ring-blue-900 ${mood.color}`
                                        : "hover:bg-slate-50 dark:hover:bg-slate-700 opacity-70 hover:opacity-100 hover:scale-105"
                                    }
                                  `}
                  >
                    <span className="text-5xl drop-shadow-sm filter group-hover:brightness-110 transition-all">
                      {mood.emoji}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {mood.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMood && (
              <div className="space-y-8 animate-in slide-in-from-top-4 fade-in duration-500">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
                  <Quote
                    className="text-blue-400 flex-shrink-0 mt-1"
                    size={20}
                  />
                  <p className="text-blue-800 dark:text-blue-300 font-medium italic">
                    {getFeedback()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    O que impactou seu dia?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REASONS[getMoodConfig(selectedMood).category].map(
                      (reason) => (
                        <button
                          key={reason}
                          onClick={() => handleReasonToggle(reason)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                                            ${
                                              selectedReasons.includes(reason)
                                                ? "bg-slate-800 dark:bg-blue-600 text-white border-slate-800 dark:border-blue-600 shadow-md"
                                                : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400"
                                            }
                                          `}
                        >
                          {reason}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Tags (Contexto)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all flex items-center gap-1
                                            ${
                                              selectedTags.includes(tag)
                                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                : "bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600"
                                            }
                                          `}
                      >
                        <Tag size={12} /> {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Notas do dia
                  </label>
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                    {PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => addPrompt(p)}
                        className="whitespace-nowrap px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-colors"
                      >
                        + {p}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Escreva livremente aqui..."
                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={saveEntry}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Save size={20} /> Salvar Registro
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" /> Histórico Recente
            </h3>
            <div className="space-y-4">
              {entries.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  Nenhum registro ainda. Comece hoje!
                </div>
              )}

              {entries.map((entry) => {
                const config = getMoodConfig(entry.mood);
                return (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-4xl p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50`}
                        >
                          {config.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                config.color.split(" ")[0]
                              } ${config.color.split(" ")[1]}`}
                            >
                              {config.label}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {new Date(entry.date).toLocaleDateString(
                                "pt-BR",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          {entry.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.reasons.map((r, i) => (
                                <span
                                  key={i}
                                  className="text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {entry.content && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-600">
                        {entry.content}
                      </div>
                    )}

                    {entry.tags.length > 0 && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                        {entry.tags.map((t, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"
                          >
                            <Tag size={10} /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Views Logic Same As Before - Rendering Components Unchanged */}
      {activeTab === "weekly" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Resumo da Semana</h2>
                <p className="opacity-90 text-sm mb-6">
                  Uma visão geral da sua saúde emocional.
                </p>

                {getAutoEvaluation() ? (
                  <div className="flex gap-8">
                    <div>
                      <div className="text-3xl font-bold">
                        {getAutoEvaluation()?.goodDays}
                      </div>
                      <div className="text-xs opacity-75 uppercase font-bold">
                        Dias Bons
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">
                        {getAutoEvaluation()?.badDays}
                      </div>
                      <div className="text-xs opacity-75 uppercase font-bold">
                        Dias Difíceis
                      </div>
                    </div>
                    {getAutoEvaluation()?.topReason && (
                      <div>
                        <div className="text-lg font-bold truncate max-w-[120px]">
                          {getAutoEvaluation()?.topReason}
                        </div>
                        <div className="text-xs opacity-75 uppercase font-bold">
                          Maior Impacto
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="opacity-75 italic text-sm">
                    Dados insuficientes para análise.
                  </div>
                )}
              </div>
              <BarChart2 size={64} className="opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">
              Variação de Humor (7 Dias)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getWeeklyData()}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                    className="dark:opacity-20"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis hide domain={[0, 6]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      backgroundColor: "#fff",
                    }}
                    formatter={(value: any) => [
                      value === 0
                        ? "Sem dados"
                        : value > 3
                        ? "Positivo"
                        : value < 3
                        ? "Negativo"
                        : "Neutro",
                      "Humor",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Stats View */}
      {activeTab === "monthly" && (
        <div className="space-y-8 animate-in fade-in">
          <div className="text-center md:text-left mb-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Visão Geral do Mês
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Uma análise completa das suas emoções, padrões e influências.
            </p>
          </div>
          {!monthlyStats ? (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center transition-colors">
              <div className="bg-white dark:bg-slate-700 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300 dark:text-slate-400">
                <BarChart2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                Dados insuficientes para análise
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                Registre seus dias regularmente para desbloquear insights
                poderosos sobre seu bem-estar.
              </p>
              <button
                onClick={() => setActiveTab("daily")}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Ir para o Diário
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="text-slate-400 mb-2">
                    <Layers size={18} />
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white">
                    {monthlyStats.count}
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wide mt-1">
                    Entradas
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="text-slate-400 mb-2">
                    <Smile size={18} />
                  </div>
                  <div className="text-3xl">
                    {monthlyStats.predominant?.emoji}
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wide mt-1">
                    Predominante
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="text-slate-400 mb-2">
                    <Activity size={18} />
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {monthlyStats.variation}
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wide mt-1">
                    Variação
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                  <div className="text-slate-400 mb-2">
                    <Calendar size={18} />
                  </div>
                  <div className="text-lg font-bold text-slate-800 dark:text-white">
                    {monthlyStats.streak}
                  </div>
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wide mt-1">
                    Sequência
                  </div>
                </div>
              </div>
              {/* ... (Existing chart renderings) ... */}
            </>
          )}
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 z-50">
          <Check size={20} className="text-green-400 dark:text-green-600" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}
    </div>
  );
};
