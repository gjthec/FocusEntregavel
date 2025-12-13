import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Video,
  Download,
  PlayCircle,
  Lock,
  Star,
  Brain,
  Zap,
  Layout,
  ShieldCheck,
  Moon,
  FileText,
  LayoutTemplate,
  FileCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  List,
  X,
} from "lucide-react";

import { PlanTier } from "../types";
import { AuthService } from "../services/authService";
import { DataService } from "../services/dataService";

import { LessonComments } from "../components/LessonComments";
import { LessonRating } from "../components/LessonRating";
import VideoPlayer from "../components/VideoPlayer";

// ---- TIPOS ----
interface Lesson {
  id?: string;
  title: string;
  duration: string;
  type: "video" | "pdf" | "audio" | "ebook";
  youtubeUrl?: string;
  // Se no futuro tiver pdfUrl/audioUrl, pode colocar aqui
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  locked: boolean; // premiumOnly no seu banco (recomendado)
  icon?: any;
  lessons: Lesson[];
}

interface Material {
  id: string;
  title: string;
  type: "pdf" | "template" | "ebook";
  size: string;
  description: string;
  premiumOnly: boolean;
}

// ---- MAP DE ÍCONES (se no banco vier string: "Brain", "Zap", etc.) ----
const ICON_MAP: Record<string, any> = {
  Brain,
  Video,
  Zap,
  Layout,
  ShieldCheck,
  Moon,
  BookOpen,
};

export const Resources: React.FC = () => {
  const user = AuthService.getCurrentUser();
  const isPremium = user?.plan === PlanTier.PREMIUM;

  const [activeTab, setActiveTab] = useState<"classes" | "materials">(
    "classes"
  );

  // vindo do banco
  const [modules, setModules] = useState<Module[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);

  // UI state
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // progresso (session local)
  const [completedLessons, setCompletedLessons] = useState<string[]>([]); // guarda lessonId (preferível)

  // Materiais continuam hardcoded (igual seu frontend)
  const materials: Material[] = [
    {
      id: "m1",
      title: "Workbook TDAH na Prática",
      type: "ebook",
      size: "2.4 MB",
      description: "Exercícios práticos para aplicar o conteúdo.",
      premiumOnly: false,
    },
    {
      id: "m2",
      title: "Planner Semanal FocusPro",
      type: "template",
      size: "0.5 MB",
      description: "Template visual para organizar sua semana.",
      premiumOnly: false,
    },
    {
      id: "m3",
      title: "Guia de Suplementação",
      type: "pdf",
      size: "1.1 MB",
      description: "Lista de vitaminas e minerais que auxiliam.",
      premiumOnly: true,
    },
    {
      id: "m4",
      title: "Mapa Mental de Dopamina",
      type: "pdf",
      size: "3.2 MB",
      description: "Infográfico visual sobre motivação.",
      premiumOnly: true,
    },
    {
      id: "m5",
      title: "Checklist Higiene do Sono",
      type: "template",
      size: "0.2 MB",
      description: "Passo a passo para colar no espelho.",
      premiumOnly: true,
    },
    {
      id: "m6",
      title: "E-book: Vencendo a Procrastinação",
      type: "ebook",
      size: "15 MB",
      description: "Livro digital completo com estratégias.",
      premiumOnly: true,
    },
  ];

  const isModuleLockedForUser = (m: Module) => Boolean(m.locked) && !isPremium;

  // --------- CARREGAR MÓDULOS + AULAS DO BANCO ---------
  useEffect(() => {
    const loadModules = async () => {
      setLoadingModules(true);
      try {
        const data = await DataService.getCourseModulesWithLessons();

        const mapped: Module[] = (data || []).map((m: any) => {
          const iconKey = typeof m.icon === "string" ? m.icon : "";
          return {
            id: String(m.id),
            title: m.title ?? "",
            description: m.description ?? "",
            duration: m.duration ?? "",
            locked: Boolean(m.locked), // no banco: premiumOnly (true/false)
            icon: ICON_MAP[iconKey] ?? Brain,
            lessons: (m.lessons || []).map((l: any) => ({
              id: l.id ? String(l.id) : undefined,
              title: l.title ?? "",
              duration: l.duration ?? "",
              type: l.type,
              youtubeUrl: l.youtube_url ?? l.youtubeUrl ?? undefined,
            })),
          };
        });

        setModules(mapped);

        // Abre o primeiro módulo acessível que tenha aula
        const firstAccessible = mapped.find(
          (m) => !isModuleLockedForUser(m) && m.lessons.length > 0
        );

        // fallback: pega o primeiro que tenha aula (mesmo que locked)
        const firstAny = mapped.find((m) => m.lessons.length > 0);

        const startModule = firstAccessible ?? firstAny;

        if (startModule) {
          setExpandedModules([startModule.id]);
          const firstLesson = startModule.lessons[0];
          if (firstLesson?.id) {
            setActiveLessonId(firstLesson.id);
          } else {
            // se por algum motivo vier sem id, não quebra a tela
            setActiveLessonId(null);
          }
        } else {
          setExpandedModules([]);
          setActiveLessonId(null);
        }
      } catch (err) {
        console.error("Erro ao carregar módulos:", err);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getCurrentLessonInfo = () => {
    if (!activeLessonId) return null;

    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const lIdx = modules[mIdx].lessons.findIndex(
        (l) => l.id === activeLessonId
      );
      if (lIdx !== -1) {
        return {
          module: modules[mIdx],
          lesson: modules[mIdx].lessons[lIdx],
          mIdx,
          lIdx,
        };
      }
    }
    return null;
  };

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessons((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const findNextUnlockedModuleIndex = (startIdx: number) => {
    for (let i = startIdx; i < modules.length; i++) {
      if (!isModuleLockedForUser(modules[i]) && modules[i].lessons.length > 0)
        return i;
    }
    return -1;
  };

  const findPrevUnlockedModuleIndex = (startIdx: number) => {
    for (let i = startIdx; i >= 0; i--) {
      if (!isModuleLockedForUser(modules[i]) && modules[i].lessons.length > 0)
        return i;
    }
    return -1;
  };

  const navigateLesson = (direction: "prev" | "next") => {
    const info = getCurrentLessonInfo();
    if (!info) return;

    const { mIdx, lIdx, module } = info;

    if (direction === "prev") {
      if (lIdx > 0) {
        const prevLesson = module.lessons[lIdx - 1];
        if (prevLesson?.id) setActiveLessonId(prevLesson.id);
      } else {
        const prevModuleIdx = findPrevUnlockedModuleIndex(mIdx - 1);
        if (prevModuleIdx !== -1) {
          const prevModule = modules[prevModuleIdx];
          const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
          if (lastLesson?.id) {
            setActiveLessonId(lastLesson.id);
            setExpandedModules((prev) =>
              prev.includes(prevModule.id) ? prev : [...prev, prevModule.id]
            );
          }
        }
      }
    } else {
      if (lIdx < module.lessons.length - 1) {
        const nextLesson = module.lessons[lIdx + 1];
        if (nextLesson?.id) setActiveLessonId(nextLesson.id);
      } else {
        const nextModuleIdx = findNextUnlockedModuleIndex(mIdx + 1);
        if (nextModuleIdx !== -1) {
          const nextModule = modules[nextModuleIdx];
          const firstLesson = nextModule.lessons[0];
          if (firstLesson?.id) {
            setActiveLessonId(firstLesson.id);
            setExpandedModules((prev) =>
              prev.includes(nextModule.id) ? prev : [...prev, nextModule.id]
            );
          }
        }
      }
    }

    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Progress
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedLessons.length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const currentInfo = getCurrentLessonInfo();
  const currentLessonId = currentInfo?.lesson.id;
  const isCurrentLessonCompleted = currentLessonId
    ? completedLessons.includes(currentLessonId)
    : false;

  const PdfViewer = ({ lesson }: { lesson: Lesson }) => {
    const [page, setPage] = useState(1);

    return (
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-8 min-h-[400px] md:h-[600px] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 relative shadow-inner">
        <div className="bg-white w-full max-w-3xl h-full shadow-2xl rounded-lg p-8 md:p-16 overflow-y-auto text-slate-800 text-base leading-loose font-serif">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">
            {lesson.title}
          </h2>
          <p className="mb-6 text-slate-600">
            Visualizador demonstrativo. Depois você pode plugar url real do PDF.
          </p>

          <div className="space-y-4 mb-8 opacity-30">
            <div className="h-4 bg-slate-900 rounded w-full"></div>
            <div className="h-4 bg-slate-900 rounded w-full"></div>
            <div className="h-4 bg-slate-900 rounded w-3/4"></div>
          </div>

          <div className="mt-12 pt-12 border-t border-slate-100 text-center text-sm text-slate-400 font-sans">
            Página {page}
          </div>
        </div>

        <div className="absolute bottom-6 bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 text-sm font-medium border border-slate-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="hover:text-blue-400 disabled:opacity-30 transition-colors"
          >
            <ChevronDown className="rotate-90" size={20} />
          </button>
          <span className="tabular-nums">Página {page} de 12</span>
          <button
            onClick={() => setPage((p) => Math.min(12, p + 1))}
            disabled={page === 12}
            className="hover:text-blue-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] flex flex-col font-sans">
      {/* HEADER & TABS */}
      <div className="flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
              <Brain className="text-blue-600 dark:text-blue-500" />
              FocusAcademy
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Sua jornada estruturada para dominar o TDAH.
            </p>
          </div>

          {!isPremium && (
            <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm w-full md:w-auto justify-center">
              <Star size={16} fill="currentColor" /> Acesso Premium Bloqueado
            </div>
          )}
        </div>

        <div className="flex border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === "classes"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Aulas & Módulos
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 whitespace-nowrap ${
              activeTab === "materials"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Materiais Complementares
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {activeTab === "classes" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 min-h-0 relative">
          {/* LEFT: Player Area */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {loadingModules ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-center h-[400px] lg:h-[500px]">
                <div className="text-center p-8 text-slate-400">
                  Carregando aulas...
                </div>
              </div>
            ) : currentInfo ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Player Container */}
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                  {currentInfo.lesson.type === "video" ||
                  currentInfo.lesson.type === "audio" ? (
                    <VideoPlayer
                      lesson={{
                        title: currentInfo.lesson.title,
                        youtubeUrl: currentInfo.lesson.youtubeUrl,
                      }}
                      onComplete={() => {
                        if (
                          currentInfo.lesson.id &&
                          !completedLessons.includes(currentInfo.lesson.id)
                        ) {
                          toggleLessonCompletion(currentInfo.lesson.id);
                        }
                      }}
                      autoPlay={true}
                    />
                  ) : (
                    <PdfViewer lesson={currentInfo.lesson} />
                  )}
                </div>

                {/* Lesson Info & Navigation */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  {/* Rating */}
                  <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    {currentInfo.lesson.id ? (
                      <LessonRating
                        lessonId={currentInfo.lesson.id}
                        currentUserId={user?.id}
                      />
                    ) : (
                      <div className="text-xs text-slate-400">
                        (Sem lessonId no banco — rating desabilitado)
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                        {currentInfo.lesson.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs uppercase tracking-wide">
                          Módulo {Number(currentInfo.mIdx) + 1}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{currentInfo.module.title}</span>
                      </div>
                    </div>

                    {/* Manual Completion */}
                    <button
                      onClick={() => {
                        if (currentInfo.lesson.id)
                          toggleLessonCompletion(currentInfo.lesson.id);
                      }}
                      className={`
                        w-full md:w-auto px-4 py-3 md:py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold
                        ${
                          isCurrentLessonCompleted
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                        }
                      `}
                      disabled={!currentInfo.lesson.id}
                      title={
                        !currentInfo.lesson.id
                          ? "Sem ID da aula no banco"
                          : "Marcar aula"
                      }
                    >
                      {isCurrentLessonCompleted ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Circle size={20} />
                      )}
                      {isCurrentLessonCompleted
                        ? "Aula Concluída"
                        : "Marcar Concluída"}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                      onClick={() => navigateLesson("prev")}
                      className="flex-1 py-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 group"
                    >
                      <ArrowLeft
                        size={18}
                        className="group-hover:-translate-x-1 transition-transform"
                      />{" "}
                      <span className="hidden sm:inline">Aula</span> Anterior
                    </button>
                    <button
                      onClick={() => navigateLesson("next")}
                      className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-3 text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/20 group"
                    >
                      Próxima <span className="hidden sm:inline">Aula</span>{" "}
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="mt-8">
                    {currentInfo.lesson.id ? (
                      <LessonComments
                        lessonId={currentInfo.lesson.id}
                        currentUser={
                          user
                            ? { id: user.id, name: user.name, role: user.role }
                            : null
                        }
                      />
                    ) : (
                      <div className="text-sm text-slate-400 italic">
                        (Sem lessonId no banco — comentários desabilitados)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Empty State
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center h-[400px] lg:h-[500px] transition-colors mb-8 lg:mb-0">
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg text-blue-500 dark:text-blue-400">
                    <PlayCircle size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-3">
                    Pronto para focar?
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-lg">
                    Selecione uma aula na barra lateral para iniciar seu
                    aprendizado.
                  </p>

                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="md:hidden mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto"
                  >
                    <List size={20} /> Ver Lista de Aulas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE SIDEBAR BUTTON */}
          {currentInfo && (
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center"
            >
              {showMobileSidebar ? <X size={24} /> : <List size={24} />}
            </button>
          )}

          {/* RIGHT: Sidebar */}
          <div
            className={`
              md:col-span-5 lg:col-span-4 flex flex-col h-full min-h-0 pl-0 lg:pl-2
              ${
                showMobileSidebar
                  ? "fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-20 px-4 pb-4"
                  : "hidden md:flex"
              }
            `}
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full shadow-lg">
              {/* Mobile header */}
              <div className="md:hidden p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  Conteúdo do Curso
                </h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress header */}
              <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-3">
                  Progresso do Curso
                </h3>
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  <span>{progressPercentage}% Concluído</span>
                  <span>
                    {completedCount}/{totalLessons} Aulas
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-700"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Modules list */}
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {modules.map((module) => {
                    const lockedForUser = isModuleLockedForUser(module);
                    const isExpanded = expandedModules.includes(module.id);
                    const isActiveModule =
                      !!activeLessonId &&
                      module.lessons.some((l) => l.id === activeLessonId);

                    const completedInModule = module.lessons.filter((l) =>
                      l.id ? completedLessons.includes(l.id) : false
                    ).length;
                    const totalInModule = module.lessons.length;
                    const isModuleComplete =
                      totalInModule > 0 && completedInModule === totalInModule;

                    const ModuleIcon = module.icon ?? Brain;

                    return (
                      <div
                        key={module.id}
                        className={`transition-colors ${
                          isActiveModule
                            ? "bg-blue-50/50 dark:bg-blue-900/5"
                            : "bg-white dark:bg-slate-800"
                        }`}
                      >
                        {/* Module Header */}
                        <button
                          onClick={() =>
                            !lockedForUser && toggleModule(module.id)
                          }
                          className={`w-full px-6 py-5 flex items-center justify-between text-left transition-all
                            ${
                              lockedForUser
                                ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                            }
                          `}
                        >
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-3 mb-1">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                  lockedForUser
                                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30"
                                }`}
                              >
                                <ModuleIcon
                                  size={18}
                                  className={
                                    lockedForUser
                                      ? "text-slate-400"
                                      : "text-blue-600 dark:text-blue-400"
                                  }
                                />
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4
                                    className={`font-bold text-base ${
                                      isExpanded || isActiveModule
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-700 dark:text-slate-200"
                                    }`}
                                  >
                                    {module.title}
                                  </h4>

                                  {!lockedForUser && isModuleComplete && (
                                    <CheckCircle2
                                      size={16}
                                      className="text-green-500"
                                    />
                                  )}
                                </div>

                                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2 font-medium mt-1">
                                  {lockedForUser ? (
                                    <span className="text-amber-500 flex items-center gap-1">
                                      <Lock size={10} /> Premium
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        completedInModule > 0
                                          ? "text-blue-500 dark:text-blue-400"
                                          : ""
                                      }
                                    >
                                      {completedInModule}/{totalInModule} aulas
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{module.duration}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`p-1 rounded-full transition-transform duration-300 ${
                              isExpanded
                                ? "rotate-180 bg-slate-100 dark:bg-slate-700"
                                : ""
                            }`}
                          >
                            <ChevronDown size={20} className="text-slate-400" />
                          </div>
                        </button>

                        {/* Lessons */}
                        {isExpanded && !lockedForUser && (
                          <div className="bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800 py-2">
                            {module.lessons.map((lesson, idx) => {
                              const lessonId =
                                lesson.id ?? `no-id:${module.id}:${idx}`;
                              const isActive = activeLessonId === lesson.id;
                              const isCompleted = lesson.id
                                ? completedLessons.includes(lesson.id)
                                : false;

                              const getLessonIcon = (type: Lesson["type"]) => {
                                switch (type) {
                                  case "video":
                                    return <PlayCircle size={16} />;
                                  case "pdf":
                                    return <FileText size={16} />;
                                  case "audio":
                                    return <Video size={16} />;
                                  default:
                                    return <PlayCircle size={16} />;
                                }
                              };

                              return (
                                <button
                                  key={lessonId}
                                  onClick={() => {
                                    if (!lesson.id) return;
                                    setActiveLessonId(lesson.id);
                                    setShowMobileSidebar(false);
                                  }}
                                  className={`w-full px-6 py-3.5 flex items-center gap-4 text-left text-sm transition-all relative group/lesson
                                    ${
                                      isActive
                                        ? "bg-blue-100/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-bold"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:pl-8"
                                    }
                                  `}
                                  disabled={!lesson.id}
                                  title={
                                    !lesson.id
                                      ? "Aula sem ID no banco"
                                      : "Abrir aula"
                                  }
                                >
                                  {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-blue-400 rounded-r-full" />
                                  )}

                                  <div
                                    className={`flex-shrink-0 transition-colors ${
                                      isCompleted
                                        ? "text-green-500"
                                        : isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      getLessonIcon(lesson.type)
                                    )}
                                  </div>

                                  <span
                                    className={`flex-1 line-clamp-1 ${
                                      isCompleted ? "opacity-50" : ""
                                    }`}
                                  >
                                    {lesson.title}
                                  </span>
                                  <span className="text-xs text-slate-400 opacity-70 flex-shrink-0">
                                    {lesson.duration}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // MATERIALS TAB
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {materials.map((item) => {
            const isLocked = item.premiumOnly && !isPremium;

            const getMaterialIcon = (type: string) => {
              switch (type) {
                case "pdf":
                  return <FileText size={28} className="text-rose-500" />;
                case "template":
                  return <LayoutTemplate size={28} className="text-blue-500" />;
                case "ebook":
                  return <BookOpen size={28} className="text-purple-500" />;
                default:
                  return (
                    <FileCheck
                      size={28}
                      className="text-slate-500 dark:text-slate-400"
                    />
                  );
              }
            };

            return (
              <div
                key={item.id}
                className={`
                  relative group p-6 rounded-3xl border shadow-sm transition-all duration-300 flex flex-col justify-between h-full overflow-hidden
                  ${
                    isLocked
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 opacity-80"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:-translate-y-1"
                  }
                `}
              >
                {item.premiumOnly && (
                  <div className="absolute top-4 right-4">
                    {isPremium ? (
                      <div className="text-amber-500 dark:text-amber-400">
                        <Star size={18} fill="currentColor" />
                      </div>
                    ) : (
                      <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 p-2 rounded-lg">
                        <Lock size={16} />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div
                    className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors
                      ${
                        isLocked
                          ? "bg-slate-100 dark:bg-slate-700 grayscale"
                          : "bg-slate-50 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                      }
                    `}
                  >
                    {getMaterialIcon(item.type)}
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {item.type} • {item.size}
                  </span>
                  <button
                    onClick={() =>
                      !isLocked && alert(`Iniciando download: ${item.title}`)
                    }
                    disabled={isLocked}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                      ${
                        isLocked
                          ? "text-slate-400 cursor-not-allowed bg-transparent"
                          : "text-blue-600 dark:text-white bg-blue-50 dark:bg-blue-600 hover:bg-blue-100 dark:hover:bg-blue-700"
                      }
                    `}
                  >
                    {isLocked ? (
                      "Premium"
                    ) : (
                      <>
                        Baixar <Download size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
