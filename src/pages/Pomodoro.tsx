import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, Pause, RotateCcw, Settings, Volume2, 
    Maximize, Bell, CloudRain, Wind, Coffee, VolumeX, 
    X, BarChart2, CheckCircle2, Battery 
} from 'lucide-react';

// Motivation messages
const MOTIVATION_MSGS = [
    "Você está indo muito bem.",
    "Respira e segue.",
    "Foco no presente.",
    "Continue, você já começou.",
    "Um passo de cada vez.",
    "Sua mente é capaz de coisas incríveis.",
    "Apenas este momento importa."
];

// Sound Options
type SoundType = 'silence' | 'rain' | 'wind' | 'cafe';

export const Pomodoro: React.FC = () => {
  // Timer State
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundType>('silence');
  const [soundEnabled, setSoundEnabled] = useState(true); // Alarm at end
  const [minimalistMode, setMinimalistMode] = useState(false);
  const [dndMode, setDndMode] = useState(false);
  
  // Stats State (Mocked for session)
  const [stats, setStats] = useState({
      todayMinutes: 45,
      weekMinutes: 320,
      sessions: 3
  });

  // Visual State
  const [currentMsg, setCurrentMsg] = useState(MOTIVATION_MSGS[0]);

  // Refs
  const timerRef = useRef<any>(null);

  // --- LOGIC ---

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft]);

  // Rotate motivation message every 5 minutes or on mode change
  useEffect(() => {
      const msgInterval = setInterval(() => {
          if (isActive && mode === 'focus') {
              const random = Math.floor(Math.random() * MOTIVATION_MSGS.length);
              setCurrentMsg(MOTIVATION_MSGS[random]);
          }
      }, 300000); // 5 min
      return () => clearInterval(msgInterval);
  }, [isActive, mode]);

  const handleTimerComplete = () => {
      setIsActive(false);
      
      // Update stats
      if (mode === 'focus') {
          setStats(prev => ({
              ...prev,
              todayMinutes: prev.todayMinutes + 25,
              weekMinutes: prev.weekMinutes + 25,
              sessions: prev.sessions + 1
          }));
      }

      // Play Alarm (Mock)
      if (soundEnabled) {
          // Audio logic would go here
          console.log("Playing alarm sound..."); 
      }

      alert(mode === 'focus' ? 'Foco concluído! Hora da pausa.' : 'Pausa concluída! De volta ao foco.');
      
      if (mode === 'focus') {
        setMode('break');
        setInitialTime(5 * 60);
        setTimeLeft(5 * 60);
        setCurrentMsg("Relaxe e recarregue.");
      } else {
        setMode('focus');
        setInitialTime(25 * 60);
        setTimeLeft(25 * 60);
        setCurrentMsg(MOTIVATION_MSGS[0]);
      }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    const newTime = mode === 'focus' ? 25 * 60 : 5 * 60;
    setInitialTime(newTime);
    setTimeLeft(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // SVG Progress Calculation (Relative Units for Perfect Scaling)
  // ViewBox 0 0 100 100 -> Center is 50,50 -> Radius is 45 (leaving margin for stroke)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / initialTime;
  const strokeDashoffset = circumference - (1 - progress) * circumference;

  // --- RENDER HELPERS ---

  const SoundButton = ({ type, icon: Icon, label }: { type: SoundType, icon: any, label: string }) => (
      <button 
        onClick={() => setSelectedSound(type)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${selectedSound === type ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
      >
          <Icon size={24} />
          <span className="text-xs font-medium">{label}</span>
      </button>
  );

  return (
    <div className={`relative w-full h-full flex flex-col transition-all duration-500 ${minimalistMode ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 justify-center' : 'max-w-2xl mx-auto py-8'}`}>
      
      {/* --- HEADER (Hidden in Minimalist) --- */}
      {!minimalistMode && (
          <div className="flex justify-between items-center mb-8 px-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Modo Foco</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Técnica Pomodoro adaptada.</p>
            </div>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
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
          >
              <X size={24} />
          </button>
      )}

      {/* --- MAIN TIMER AREA --- */}
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        
        {/* TIMER CONTAINER - Scales perfectly */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
            
            {/* SVG RING - Scalable & Perfect Circle */}
            <svg 
                className="w-full h-full transform -rotate-90 drop-shadow-sm" 
                viewBox="0 0 100 100"
            >
                {/* Track Circle (Background) */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3" /* Thin elegant border (approx 8-10px rendered) */
                    className="text-slate-100 dark:text-slate-800"
                />
                
                {/* Progress Circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3" /* Matching thin border */
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'text-blue-600 dark:text-blue-500' : 'text-green-500'}`}
                />
            </svg>

            {/* Content Centered Absolutely */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                {/* Time Display */}
                <div className={`text-6xl md:text-7xl font-sans font-bold tracking-tight mb-2 tabular-nums ${mode === 'focus' ? 'text-slate-800 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                    {formatTime(timeLeft)}
                </div>
                
                {/* Status Label */}
                <div className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 mb-3">
                    {mode === 'focus' ? 'Focando' : 'Pausa'}
                </div>
                
                {/* Dynamic Motivation (Fade In/Out Container) */}
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
            >
                <RotateCcw size={24} />
            </button>

            <button 
                onClick={toggleTimer}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${mode === 'focus' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none' : 'bg-green-600 hover:bg-green-700 shadow-green-200 dark:shadow-none'}`}
            >
                {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            {/* Quick Minimalist Toggle if not already in it */}
            {!minimalistMode && (
                <button 
                    onClick={() => setMinimalistMode(true)}
                    className="p-4 rounded-full text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Modo Minimalista"
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
                    <Battery size={20}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Dica de Foco</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Mantenha uma folha de papel ao lado. Se lembrar de algo, anote e volte ao foco imediatamente.
                    </p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-3 items-start">
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-green-500">
                    <Coffee size={20}/>
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1">Dica de Pausa</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Evite redes sociais na pausa curta. Prefira alongar, beber água ou apenas fechar os olhos.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* --- SETTINGS SIDE PANEL (DRAWER) --- */}
      {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsSettingsOpen(false)} />
            
            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-800 shadow-2xl z-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Opções</h2>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X size={24}/>
                    </button>
                </div>

                {/* Section: Sounds */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Volume2 size={14}/> Ambiente Sonoro
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <SoundButton type="silence" icon={VolumeX} label="Silêncio" />
                        <SoundButton type="rain" icon={CloudRain} label="Chuva" />
                        <SoundButton type="wind" icon={Wind} label="Vento" />
                        <SoundButton type="cafe" icon={Coffee} label="Cafeteria" />
                    </div>
                </div>

                {/* Section: Toggles */}
                <div className="mb-8 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Settings size={14}/> Preferências
                    </h3>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Alarme ao final</span>
                        <button 
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${soundEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Modo Minimalista</span>
                        <button 
                            onClick={() => { setMinimalistMode(!minimalistMode); setIsSettingsOpen(false); }}
                            className={`w-12 h-6 rounded-full transition-colors relative ${minimalistMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${minimalistMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Não Perturbe</span>
                        <button 
                            onClick={() => setDndMode(!dndMode)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${dndMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${dndMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Section: Stats */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BarChart2 size={14}/> Estatísticas Rápidas
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Tempo Hoje</span>
                            <span className="font-bold text-slate-800 dark:text-white">{stats.todayMinutes} min</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Sessões</span>
                            <span className="font-bold text-slate-800 dark:text-white">{stats.sessions}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-600">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Total Semana</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(stats.weekMinutes / 60)}h {stats.weekMinutes % 60}m</span>
                        </div>
                    </div>
                </div>

            </div>
          </>
      )}
    </div>
  );
};