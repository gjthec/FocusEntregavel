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
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
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
          setActiveLesson(mapped[0].lessons[0].title);
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
    if (!activeLesson) return null;
    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const lIdx = modules[mIdx].lessons.findIndex(
        (l) => l.title === activeLesson
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
        setActiveLesson(module.lessons[lIdx - 1].title);
      } else if (mIdx > 0) {
        const prevModule = modules[mIdx - 1];
        if (!prevModule.locked) {
          setActiveLesson(
            prevModule.lessons[prevModule.lessons.length - 1].title
          );
          if (!expandedModules.includes(prevModule.id))
            setExpandedModules([...expandedModules, prevModule.id]);
        }
      }
    } else {
      if (lIdx < module.lessons.length - 1) {
        setActiveLesson(module.lessons[lIdx + 1].title);
      } else if (mIdx < modules.length - 1) {
        const nextModule = modules[mIdx + 1];
        if (!nextModule.locked) {
          setActiveLesson(nextModule.lessons[0].title);
          if (!expandedModules.includes(nextModule.id))
            setExpandedModules([...expandedModules, nextModule.id]);
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

  // --- SUB-COMPONENTS WITH ASYNC DATA ---

  const LessonComments = ({ lessonTitle }: { lessonTitle: string }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
      DataService.getLessonComments(lessonTitle).then(setComments);
      setNewComment("");
    }, [lessonTitle]);

    const handlePost = async () => {
      if (!newComment.trim() || !user) return;
      try {
        const comment = await DataService.addLessonComment(
          lessonTitle,
          user.id,
          user.name,
          newComment
        );
        setComments([comment, ...comments]);
        setNewComment("");
      } catch (err) {
        console.error(err);
      }
    };

    const handleDelete = async (id: string) => {
      if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
        setComments(comments.filter((c) => c.id !== id));
        try {
          await DataService.deleteLessonComment(id);
        } catch (err) {
          console.error(err);
        }
      }
    };

    return (
      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <MessageSquare size={20} className="text-blue-500" />
          Dúvidas e Comentários
        </h3>
        <div className="flex gap-4 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário ou dúvida..."
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-slate-700 dark:text-slate-200 h-24 transition-all"
              />
              <button
                onClick={handlePost}
                disabled={!newComment.trim()}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-slate-400 text-center text-sm italic py-4">
              Seja o primeiro a comentar nesta aula!
            </p>
          ) : (
            comments.map((comment) => {
              const isAuthor = user?.id === comment.userId;
              const isAdmin = user?.role === UserRole.ADMIN;
              const date = new Date(comment.createdAt);

              return (
                <div key={comment.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1 bg-slate-50/50 dark:bg-slate-700/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          {comment.userName}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {date.toLocaleDateString()} às{" "}
                          {date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {(isAuthor || isAdmin) && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                          title="Excluir comentário"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const LessonRating = ({ lessonTitle }: { lessonTitle: string }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const [stats, setStats] = useState({ average: 0, count: 0, userRating: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!user) return;
      DataService.getLessonRating(lessonTitle, user.id).then((data) => {
        setStats(data);
        setIsLoading(false);
      });
      setHoverRating(0);
    }, [lessonTitle, user]);

    const handleRate = async (rating: number) => {
      if (!user) return;
      try {
        const newStats = await DataService.rateLesson(
          lessonTitle,
          user.id,
          rating
        );
        setStats(newStats);
      } catch (err) {
        console.error(err);
      }
    };

    if (isLoading)
      return (
        <div className="h-6 w-32 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
      );

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRate(star)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={20}
                className={`transition-colors duration-200 ${
                  (hoverRating ? star <= hoverRating : star <= stats.userRating)
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
            {stats.average.toFixed(1)}
          </span>
          <span>({stats.count} avaliações)</span>
        </div>
      </div>
    );
  };

  // VideoPlayer e PdfViewer (aqui você pode usar youtubeUrl depois se quiser embutir o iframe)
  const VideoPlayer = ({
    lesson,
    onComplete,
  }: {
    lesson: Lesson;
    onComplete: () => void;
  }) => {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(80);
    const [speed, setSpeed] = useState(1);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
      if (playing && progress < 100) {
        intervalRef.current = setInterval(() => {
          setProgress((p) => {
            const next = p + 0.5;
            if (next >= 90 && p < 90) onComplete();
            return next > 100 ? 100 : next;
          });
        }, 100);
      } else {
        clearInterval(intervalRef.current);
      }
      return () => clearInterval(intervalRef.current);
    }, [playing, onComplete]);

    useEffect(() => {
      setProgress(0);
      setPlaying(false);
    }, [lesson.title]);

    return (
      <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative group border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-slate-700 dark:text-slate-600 text-9xl opacity-10 animate-pulse">
            <Video size={120} />
          </div>
          {!playing && (
            <button
              onClick={() => setPlaying(true)}
              className="absolute z-10 bg-blue-600/90 hover:bg-blue-500 backdrop-blur-md rounded-full p-6 transition-all transform hover:scale-110 shadow-xl shadow-blue-900/20"
            >
              <Play size={48} fill="white" className="ml-1" />
            </button>
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 transition-opacity duration-300 ${
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <div
            className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-white">
            <button onClick={() => setPlaying(!playing)}>
              <Pause size={28} fill="currentColor" />
            </button>
          </div>
        </div>
      </div>
    );
  };

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
                      lesson={currentInfo.lesson}
                      onComplete={() =>
                        !completedLessons.includes(currentInfo.lesson.title) &&
                        toggleLessonCompletion(currentInfo.lesson.title)
                      }
                    />
                  ) : (
                    <PdfViewer lesson={currentInfo.lesson} />
                  )}
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                    <LessonRating lessonTitle={currentInfo.lesson.title} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {currentInfo.lesson.title}
                  </h2>
                  <LessonComments lessonTitle={currentInfo.lesson.title} />
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
                            onClick={() => setActiveLesson(l.title)}
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
