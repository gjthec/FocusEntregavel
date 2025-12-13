import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  Maximize,
  CloudRain,
  Wind,
  Coffee,
  VolumeX,
  X,
  BarChart2,
  Battery,
} from "lucide-react";

// Motivation messages
const MOTIVATION_MSGS = [
  "Você está indo muito bem.",
  "Respira e segue.",
  "Foco no presente.",
  "Continue, você já começou.",
  "Um passo de cada vez.",
  "Sua mente é capaz de coisas incríveis.",
  "Apenas este momento importa.",
];

// Sound Options
type SoundType = "silence" | "rain" | "wind" | "cafe";
type Mode = "focus" | "break";

type Stats = {
  todayMinutes: number;
  weekMinutes: number;
  sessions: number;
};

type Toast = {
  title: string;
  message?: string;
  variant?: "success" | "info";
} | null;

const clampInt = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.trunc(n)));

const safeNow = () => Date.now();

export const Pomodoro: React.FC = () => {
  // ---- SETTINGS (durations) ----
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // Timer State
  const [mode, setMode] = useState<Mode>("focus");
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>("silence");
  const [soundEnabled, setSoundEnabled] = useState(true); // Alarm at end
  const [minimalistMode, setMinimalistMode] = useState(false);
  const [dndMode, setDndMode] = useState(false);

  // Stats (persist simple)
  const [stats, setStats] = useState<Stats>({
    todayMinutes: 0,
    weekMinutes: 0,
    sessions: 0,
  });

  // Visual State
  const [currentMsg, setCurrentMsg] = useState(MOTIVATION_MSGS[0]);
  const [toast, setToast] = useState<Toast>(null);

  // ---- REFS (for stable interval logic) ----
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endAtRef = useRef<number | null>(null);

  const modeRef = useRef<Mode>(mode);
  const initialTimeRef = useRef<number>(initialTime);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const dndModeRef = useRef<boolean>(dndMode);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    initialTimeRef.current = initialTime;
  }, [initialTime]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    dndModeRef.current = dndMode;
  }, [dndMode]);

  // ---- PERSIST (optional) ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("pomodoro_v1");
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (typeof saved?.focusMinutes === "number")
        setFocusMinutes(saved.focusMinutes);
      if (typeof saved?.breakMinutes === "number")
        setBreakMinutes(saved.breakMinutes);
      if (typeof saved?.selectedSound === "string")
        setSelectedSound(saved.selectedSound);
      if (typeof saved?.soundEnabled === "boolean")
        setSoundEnabled(saved.soundEnabled);
      if (typeof saved?.minimalistMode === "boolean")
        setMinimalistMode(saved.minimalistMode);
      if (typeof saved?.dndMode === "boolean") setDndMode(saved.dndMode);

      if (saved?.stats) setStats(saved.stats);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "pomodoro_v1",
        JSON.stringify({
          focusMinutes,
          breakMinutes,
          selectedSound,
          soundEnabled,
          minimalistMode,
          dndMode,
          stats,
        })
      );
    } catch {
      // ignore
    }
  }, [
    focusMinutes,
    breakMinutes,
    selectedSound,
    soundEnabled,
    minimalistMode,
    dndMode,
    stats,
  ]);

  // ---- UTILS ----
  const showToast = (t: Toast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(t);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const playBeep = () => {
    try {
      // WebAudio beep (no file needed)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.type = "sine";
      o.frequency.value = 880;

      g.gain.value = 0.0001;

      o.connect(g);
      g.connect(ctx.destination);

      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      o.start(now);
      o.stop(now + 0.6);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {
          //
        }
      }, 800);
    } catch {
      //
    }
  };

  const stopAmbient = () => {
    const a = ambientAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {
      //
    }
  };

  const ensureAmbient = async (type: SoundType) => {
    // Troque esses caminhos pelos seus arquivos reais:
    // public/sounds/rain.mp3, wind.mp3, cafe.mp3
    const map: Record<Exclude<SoundType, "silence">, string> = {
      rain: "/sounds/rain.mp3",
      wind: "/sounds/wind.mp3",
      cafe: "/sounds/cafe.mp3",
    };

    if (type === "silence") {
      stopAmbient();
      return;
    }

    const src = map[type];
    if (!src) return;

    let a = ambientAudioRef.current;
    if (!a) {
      a = new Audio();
      a.loop = true;
      a.preload = "auto";
      a.volume = 0.35;
      ambientAudioRef.current = a;
    }

    // Atualiza src se mudou
    if (!a.src || !a.src.endsWith(src)) {
      a.src = src;
    }

    try {
      await a.play();
    } catch {
      // autoplay pode bloquear até interação (normal)
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // ---- APPLY DURATION WHEN MODE CHANGES OR USER EDITS (if not running) ----
  useEffect(() => {
    if (isActive) return;

    const sec = (mode === "focus" ? focusMinutes : breakMinutes) * 60;
    setInitialTime(sec);
    setTimeLeft(sec);
  }, [focusMinutes, breakMinutes, mode, isActive]);

  // ---- TIMER CORE (no drift) ----
  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const startTicking = () => {
    clearTick();

    endAtRef.current = safeNow() + timeLeft * 1000;

    tickRef.current = setInterval(() => {
      const endAt = endAtRef.current;
      if (!endAt) return;

      const leftMs = endAt - safeNow();
      const next = Math.max(0, Math.ceil(leftMs / 1000));

      setTimeLeft((prev) => (prev === next ? prev : next));

      if (next <= 0) {
        clearTick();
        endAtRef.current = null;
        setIsActive(false);
        handleTimerComplete(); // completion
      }
    }, 250);
  };

  useEffect(() => {
    if (isActive) startTicking();
    else clearTick();

    return () => clearTick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ---- AMBIENT SOUND: play only while active ----
  useEffect(() => {
    if (!isActive) {
      stopAmbient();
      return;
    }
    ensureAmbient(selectedSound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSound, isActive]);

  // Rotate motivation message every 5 minutes (only focus + active)
  useEffect(() => {
    const msgInterval = setInterval(() => {
      if (isActive && modeRef.current === "focus") {
        const random = Math.floor(Math.random() * MOTIVATION_MSGS.length);
        setCurrentMsg(MOTIVATION_MSGS[random]);
      }
    }, 300000);

    return () => clearInterval(msgInterval);
  }, [isActive]);

  // ---- COMPLETE ----
  const handleTimerComplete = () => {
    stopAmbient();

    const completedMode = modeRef.current;
    const sessionSeconds = initialTimeRef.current;
    const sessionMinutes = Math.round(sessionSeconds / 60);

    // Update stats based on actual session length
    if (completedMode === "focus") {
      setStats((prev) => ({
        ...prev,
        todayMinutes: prev.todayMinutes + sessionMinutes,
        weekMinutes: prev.weekMinutes + sessionMinutes,
        sessions: prev.sessions + 1,
      }));
    }

    // Alarm / UI feedback respecting DND
    if (!dndModeRef.current) {
      if (soundEnabledRef.current) {
        // beep a few times
        playBeep();
        setTimeout(playBeep, 700);
        setTimeout(playBeep, 1400);
      }

      showToast(
        completedMode === "focus"
          ? {
              title: "Foco concluído!",
              message: "Hora da pausa.",
              variant: "success",
            }
          : {
              title: "Pausa concluída!",
              message: "De volta ao foco.",
              variant: "info",
            }
      );
    } else {
      // DND: feedback mais silencioso
      showToast({
        title: "Ciclo concluído (DND)",
        message: "Sem alertas sonoros.",
        variant: "info",
      });
    }

    // Switch mode + reset times
    if (completedMode === "focus") {
      setMode("break");
      const sec = breakMinutes * 60;
      setInitialTime(sec);
      setTimeLeft(sec);
      setCurrentMsg("Relaxe e recarregue.");
    } else {
      setMode("focus");
      const sec = focusMinutes * 60;
      setInitialTime(sec);
      setTimeLeft(sec);
      setCurrentMsg(MOTIVATION_MSGS[0]);
    }
  };

  const toggleTimer = () => {
    setIsActive((prev) => !prev);
    // Se tá saindo do pause (indo para active), a interação do usuário já ajuda a liberar play de áudio.
  };

  const resetTimer = () => {
    setIsActive(false);
    stopAmbient();
    const sec = (mode === "focus" ? focusMinutes : breakMinutes) * 60;
    setInitialTime(sec);
    setTimeLeft(sec);
    showToast({
      title: "Reiniciado",
      message: "Timer resetado para o tempo padrão.",
      variant: "info",
    });
  };

  // ---- SVG PROGRESS ----
  const radius = 45;
  const circumference = useMemo(() => 2 * Math.PI * radius, []);
  const safeInitial = Math.max(1, initialTime);
  const progress = timeLeft / safeInitial;
  const strokeDashoffset = circumference - (1 - progress) * circumference;

  // ---- UI HELPERS ----
  const SoundButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: SoundType;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setSelectedSound(type)}
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
        selectedSound === type
          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400"
          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
      }`}
      type="button"
    >
      <Icon size={24} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  const Toggle = ({
    value,
    onChange,
    onColor = "bg-blue-600",
  }: {
    value: boolean;
    onChange: () => void;
    onColor?: string;
  }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        value ? onColor : "bg-slate-200 dark:bg-slate-700"
      }`}
      type="button"
    >
      <div
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
          value ? "left-7" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div
      className={`relative w-full h-full flex flex-col transition-all duration-500 ${
        minimalistMode
          ? "fixed inset-0 z-50 bg-white dark:bg-slate-900 justify-center"
          : "max-w-2xl mx-auto py-8"
      }`}
    >
      {/* --- TOAST --- */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-sm min-w-[260px] ${
              toast.variant === "success"
                ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <div className="font-bold text-slate-800 dark:text-white">
              {toast.title}
            </div>
            {toast.message && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {toast.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- HEADER (Hidden in Minimalist) --- */}
      {!minimalistMode && (
        <div className="flex justify-between items-center mb-8 px-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Modo Foco
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Técnica Pomodoro adaptada.
            </p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            type="button"
          >
            <Settings size={20} />
          </button>
        </div>
      )}

      {/* --- MINIMALIST EXIT BUTTON --- */}
      {minimalistMode && (
        <button
          onClick={() => setMinimalistMode(false)}
          className="absolute top-8 right-8 p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-50 opacity-50 hover:opacity-100"
          title="Sair do modo minimalista"
          type="button"
        >
          <X size={24} />
        </button>
      )}

      {/* --- MAIN TIMER AREA --- */}
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90 drop-shadow-sm"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`transition-all duration-1000 ease-linear ${
                mode === "focus"
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-green-500"
              }`}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
            <div
              className={`text-6xl md:text-7xl font-sans font-bold tracking-tight mb-2 tabular-nums ${
                mode === "focus"
                  ? "text-slate-800 dark:text-white"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {formatTime(timeLeft)}
            </div>

            <div className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-3">
              {mode === "focus" ? "Focando" : "Pausa"}
            </div>

            <div className="h-8 flex items-center justify-center px-4 w-full max-w-[200px]">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center animate-in fade-in zoom-in duration-500 leading-tight">
                {currentMsg}
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-12 flex items-center gap-8">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Reiniciar"
            type="button"
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${
              mode === "focus"
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
                : "bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none"
            }`}
            type="button"
          >
            {isActive ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>

          {!minimalistMode && (
            <button
              onClick={() => setMinimalistMode(true)}
              className="p-4 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Modo Minimalista"
              type="button"
            >
              <Maximize size={24} />
            </button>
          )}
        </div>
      </div>

      {/* --- FOOTER TIPS (Hidden in Minimalist) --- */}
      {!minimalistMode && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 px-4 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-3 items-start">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500">
              <Battery size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">
                Dica de Foco
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Mantenha uma folha de papel ao lado. Se lembrar de algo, anote e
                volte ao foco imediatamente.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-3 items-start">
            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-green-500">
              <Coffee size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">
                Dica de Pausa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Evite redes sociais na pausa curta. Prefira alongar, beber água
                ou apenas fechar os olhos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS SIDE PANEL (DRAWER) --- */}
      {isSettingsOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsSettingsOpen(false)}
          />

          <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Opções
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            {/* Durations */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings size={14} /> Tempo
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Foco
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {focusMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    value={focusMinutes}
                    onChange={(e) =>
                      setFocusMinutes(clampInt(Number(e.target.value), 5, 90))
                    }
                    className="w-full"
                    disabled={isActive}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isActive ? "Pausa o timer para ajustar." : "Ajuste livre."}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Pausa
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {breakMinutes} min
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={breakMinutes}
                    onChange={(e) =>
                      setBreakMinutes(clampInt(Number(e.target.value), 1, 30))
                    }
                    className="w-full"
                    disabled={isActive}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isActive ? "Pausa o timer para ajustar." : "Ajuste livre."}
                  </p>
                </div>
              </div>
            </div>

            {/* Sounds */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Volume2 size={14} /> Ambiente Sonoro
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <SoundButton type="silence" icon={VolumeX} label="Silêncio" />
                <SoundButton type="rain" icon={CloudRain} label="Chuva" />
                <SoundButton type="wind" icon={Wind} label="Vento" />
                <SoundButton type="cafe" icon={Coffee} label="Cafeteria" />
              </div>

              <p className="text-[11px] text-slate-400 mt-3 leading-snug">
                Dica: coloque seus áudios em{" "}
                <span className="font-bold">/public/sounds</span> com os nomes{" "}
                <span className="font-bold">rain.mp3</span>,{" "}
                <span className="font-bold">wind.mp3</span>,{" "}
                <span className="font-bold">cafe.mp3</span>.
              </p>
            </div>

            {/* Toggles */}
            <div className="mb-8 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Settings size={14} /> Preferências
              </h3>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Alarme ao final
                </span>
                <Toggle
                  value={soundEnabled}
                  onChange={() => setSoundEnabled((v) => !v)}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Modo Minimalista
                </span>
                <Toggle
                  value={minimalistMode}
                  onChange={() => {
                    setMinimalistMode((v) => !v);
                    setIsSettingsOpen(false);
                  }}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Não Perturbe
                </span>
                <Toggle
                  value={dndMode}
                  onChange={() => setDndMode((v) => !v)}
                  onColor="bg-indigo-600"
                />
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={14} /> Estatísticas Rápidas
              </h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Tempo Hoje
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {stats.todayMinutes} min
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Sessões
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {stats.sessions}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Total Semana
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(stats.weekMinutes / 60)}h{" "}
                    {stats.weekMinutes % 60}m
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStats({ todayMinutes: 0, weekMinutes: 0, sessions: 0 });
                    showToast({
                      title: "Stats zeradas",
                      message: "Tudo limpo.",
                      variant: "info",
                    });
                  }}
                  className="w-full mt-2 text-xs font-bold py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                  Zerar estatísticas
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
