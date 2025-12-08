import React, { useState, useRef, useEffect } from "react";
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  ArrowRight,
  List,
  X,
  Send,
  Trash2,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";
import { PlanTier, UserRole, Comment } from "../types";
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
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  locked: boolean;
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

export const Resources: React.FC = () => {
  const user = AuthService.getCurrentUser();
  const isPremium = user?.plan === PlanTier.PREMIUM;
  const [activeTab, setActiveTab] = useState<"classes" | "materials">(
    "classes"
  );

  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const [loadingModules, setLoadingModules] = useState(true);

  // MATERIAIS AINDA HARDCODEADOS (pode jogar pro banco depois se quiser)
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
    // ... (mantém estrutura)
  ];

  // --------- CARREGAR MÓDULOS + AULAS DO BANCO ---------
  useEffect(() => {
    const loadModules = async () => {
      try {
        const data = await DataService.getCourseModulesWithLessons();
        // data vem do Supabase com: id, title, description, duration, locked, icon, lessons[]
        const mapped: Module[] = (data || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          duration: m.duration,
          locked: m.locked,
          // Se quiser mapear string de ícone -> componente:
          icon: Brain, // por enquanto usa Brain pra todos, depois dá pra mapear por m.icon
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            duration: l.duration,
            type: l.type,
            youtubeUrl: l.youtube_url,
          })),
        }));

        setModules(mapped);

        // Abre o primeiro módulo e seleciona a primeira aula automaticamente
        if (mapped.length > 0 && mapped[0].lessons.length > 0) {
          setExpandedModules([mapped[0].id]);
          setActiveLessonId(mapped[0].lessons[0].id!);
        }
      } catch (err) {
        console.error("Erro ao carregar módulos:", err);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, []);

  const toggleModule = (moduleId: string) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter((id) => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
    }
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
  const toggleLessonCompletion = (lessonTitle: string) => {
    setCompletedLessons((prev) =>
      prev.includes(lessonTitle)
        ? prev.filter((t) => t !== lessonTitle)
        : [...prev, lessonTitle]
    );
  };

  const navigateLesson = (direction: "prev" | "next") => {
    const info = getCurrentLessonInfo();
    if (!info) return;
    const { mIdx, lIdx, module } = info;

    if (direction === "prev") {
      if (lIdx > 0) {
        setActiveLessonId(module.lessons[lIdx - 1].id!);
      } else if (mIdx > 0) {
        const prevModule = modules[mIdx - 1];
        if (!prevModule.locked && prevModule.lessons.length) {
          setActiveLessonId(
            prevModule.lessons[prevModule.lessons.length - 1].id!
          );
          if (!expandedModules.includes(prevModule.id)) {
            setExpandedModules([...expandedModules, prevModule.id]);
          }
        }
      }
    } else {
      if (lIdx < module.lessons.length - 1) {
        setActiveLessonId(module.lessons[lIdx + 1].id!);
      } else if (mIdx < modules.length - 1) {
        const nextModule = modules[mIdx + 1];
        if (!nextModule.locked && nextModule.lessons.length) {
          setActiveLessonId(nextModule.lessons[0].id!);
          if (!expandedModules.includes(nextModule.id)) {
            setExpandedModules([...expandedModules, nextModule.id]);
          }
        }
      }
    }

    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedLessons.length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const PdfViewer = ({ lesson }: { lesson: Lesson }) => {
    return (
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-8 min-h-[400px] md:h-[600px] flex flex-col items-center justify-center border border-slate-200 dark:border-slate-700 relative shadow-inner">
        <div className="text-slate-400">
          PDF Viewer Placeholder for {lesson.title}
        </div>
      </div>
    );
  };

  const currentInfo = getCurrentLessonInfo();
  const isCurrentLessonCompleted = currentInfo
    ? completedLessons.includes(currentInfo.lesson.title)
    : false;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 min-h-[calc(100vh-6rem)] lg:h-[calc(100vh-6rem)] flex flex-col font-sans">
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
        </div>
        <div className="flex border-b border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab("classes")}
            className={`px-8 py-4 font-bold text-sm border-b-2 ${
              activeTab === "classes"
                ? "border-blue-600 text-blue-600"
                : "border-transparent"
            }`}
          >
            Aulas
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-8 py-4 font-bold text-sm border-b-2 ${
              activeTab === "materials"
                ? "border-blue-600 text-blue-600"
                : "border-transparent"
            }`}
          >
            Materiais
          </button>
        </div>
      </div>

      {activeTab === "classes" ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 min-h-0 relative">
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin">
            {loadingModules ? (
              <div className="text-center p-8 text-slate-400">
                Carregando aulas...
              </div>
            ) : !currentInfo ? (
              <div className="text-center p-8 text-slate-400">
                Selecione uma aula para começar.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                  {currentInfo.lesson.type === "video" ||
                  currentInfo.lesson.type === "audio" ? (
                    <VideoPlayer
                      lesson={{
                        title: currentInfo.lesson.title,
                        youtubeUrl: currentInfo.lesson.youtubeUrl, // já vem do banco
                      }}
                      onComplete={() =>
                        !completedLessons.includes(currentInfo.lesson.title) &&
                        toggleLessonCompletion(currentInfo.lesson.title)
                      }
                      autoPlay={true}
                    />
                  ) : (
                    <PdfViewer lesson={currentInfo.lesson} />
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <LessonRating
                      lessonId={currentInfo.lesson.id!}
                      currentUserId={user?.id}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {currentInfo.lesson.title}
                  </h2>
                  <LessonComments
                    lessonId={currentInfo.lesson.id!}
                    currentUser={
                      user
                        ? { id: user.id, name: user.name, role: user.role }
                        : null
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className={`md:col-span-5 lg:col-span-4 flex flex-col h-full min-h-0 ${
              showMobileSidebar
                ? "fixed inset-0 z-40 bg-white pt-20 px-4"
                : "hidden md:flex"
            }`}
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full shadow-lg">
              <div className="overflow-y-auto flex-1 p-2">
                {modules.map((module) => (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full text-left p-4 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {module.title}
                    </button>
                    {expandedModules.includes(module.id) && (
                      <div className="pl-4">
                        {module.lessons.map((l, i) => (
                          <button
                            key={l.id || i}
                            onClick={() => setActiveLessonId(l.id!)}
                            className="block p-2 text-sm text-slate-500 hover:text-blue-500"
                          >
                            {l.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>Materiais list...</div>
      )}
    </div>
  );
};
