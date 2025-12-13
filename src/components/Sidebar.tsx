import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { User, UserRole, PlanTier } from "../types";
import { AuthService } from "../services/authService";
import { ThemeContext } from "../App";
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Book,
  ShieldAlert,
  LogOut,
  Crown,
  BrainCircuit,
  Sun,
  Moon,
  X,
  Users,
  Sparkles,
  Lock,
  ArrowUpRight,
} from "lucide-react";

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

// Define variant types for specific color logic
type NavVariant =
  | "admin"
  | "dashboard"
  | "focus"
  | "resources"
  | "journal"
  | "community"
  | "default";

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  // ✅ Regras de negócio (visitas + modal de upgrade)
  const storageKey = useMemo(() => `focuspro_nav_visits_${user.id}`, [user.id]);
  const [navVisits, setNavVisits] = useState<Record<string, boolean>>({});
  const [upgradeInfo, setUpgradeInfo] = useState<{
    feature: string;
    required: PlanTier;
    current: PlanTier;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      setNavVisits(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to parse nav visits", error);
    }
  }, [storageKey]);

  const persistVisits = useCallback(
    (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
      setNavVisits((prev) => {
        const updated = updater(prev);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey]
  );

  const markVisited = useCallback(
    (path: string) => {
      persistVisits((prev) => (prev[path] ? prev : { ...prev, [path]: true }));
    },
    [persistVisits]
  );

  useEffect(() => {
    markVisited(location.pathname);
  }, [location.pathname, markVisited]);

  const isActive = (path: string) => location.pathname === path;

  const nextPlanFor = useMemo(() => {
    return {
      [PlanTier.BASIC]: PlanTier.PRO,
      [PlanTier.PRO]: PlanTier.PREMIUM,
      [PlanTier.PREMIUM]: PlanTier.PREMIUM,
    } as const;
  }, []);

  const getPlanCardStyles = (plan: PlanTier) => {
    switch (plan) {
      case PlanTier.BASIC:
        return {
          container:
            "bg-[rgba(77,170,255,0.18)] border-[#4DAAFF] shadow-[0_0_12px_rgba(77,170,255,0.15)]",
          text: "text-[#2563EB] dark:text-[#8ECFFF]",
          iconColor: "text-[#2563EB] dark:text-[#8ECFFF]",
          label: "Basic",
        };
      case PlanTier.PRO:
        return {
          container:
            "bg-[rgba(122,63,255,0.18)] border-[#7A3FFF] shadow-[0_0_12px_rgba(122,63,255,0.15)]",
          text: "text-[#7C3AED] dark:text-[#A784FF]",
          iconColor: "text-[#7C3AED] dark:text-[#A784FF]",
          label: "Pro",
        };
      case PlanTier.PREMIUM:
        return {
          container:
            "bg-[rgba(255,215,100,0.18)] border-[#FFD763] shadow-[0_0_12px_rgba(255,215,100,0.35)]",
          text: "text-[#D97706] dark:text-[#FFE08A]",
          iconColor: "text-[#D97706] dark:text-[#FFE08A]",
          label: "Premium",
        };
      default:
        return {
          container: "bg-slate-100 border-slate-200",
          text: "text-slate-600",
          iconColor: "text-slate-500",
          label: "Plano",
        };
    }
  };

  const planStyle = getPlanCardStyles(user.plan);

  // NavItem Component (MESMA casca) + regras de negócio (visitas / bloqueio / nag / upgrade)
  const NavItem = ({
    to,
    icon: Icon,
    label,
    restricted,
    premium,
    variant = "default",
    requiredPlan,
  }: {
    to: string;
    icon: any;
    label: string;
    restricted?: boolean;
    premium?: boolean;
    variant?: NavVariant;
    requiredPlan?: PlanTier;
  }) => {
    const active = isActive(to);
    const showNag = !restricted && !navVisits[to];

    const handleClick = (e: React.MouseEvent) => {
      if (restricted) {
        e.preventDefault();
        setUpgradeInfo({
          feature: label,
          required: requiredPlan || nextPlanFor[user.plan],
          current: user.plan,
        });
        return;
      }

      if (!navVisits[to]) markVisited(to);
      onClose();
    };

    const getVariantClasses = (v: NavVariant, isActiveNow: boolean) => {
      const baseHoverLight = "hover:bg-slate-100";

      switch (v) {
        case "admin":
          return isActiveNow
            ? "bg-[rgba(37,99,235,0.35)] text-[#2563EB] border-[#1D4ED8] dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-transparent dark:border-blue-500 dark:text-white"
            : "hover:bg-[rgba(37,99,235,0.25)] hover:text-[#2563EB] dark:hover:bg-[rgba(77,170,255,0.12)] dark:hover:text-[#4DAAFF]";
        case "dashboard":
          return isActiveNow
            ? "bg-[rgba(124,58,237,0.35)] text-[#7C3AED] border-[#6D28D9] dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-transparent dark:border-blue-500 dark:text-white"
            : "hover:bg-[rgba(124,58,237,0.25)] hover:text-[#7C3AED] dark:hover:bg-[rgba(122,63,255,0.12)] dark:hover:text-[#7A3FFF]";
        case "focus":
          return isActiveNow
            ? "bg-[rgba(245,158,11,0.45)] text-[#D97706] border-[#D97706] dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-transparent dark:border-blue-500 dark:text-white"
            : "hover:bg-[rgba(245,158,11,0.35)] hover:text-[#F59E0B] dark:hover:bg-[rgba(255,215,100,0.12)] dark:hover:text-[#FFD764]";
        case "resources":
          return isActiveNow
            ? "bg-[rgba(16,185,129,0.40)] text-[#059669] border-[#059669] dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-transparent dark:border-blue-500 dark:text-white"
            : "hover:bg-[rgba(16,185,129,0.30)] hover:text-[#10B981] dark:hover:bg-[rgba(100,255,210,0.12)] dark:hover:text-[#64FFD2]";
        case "journal":
          return isActiveNow
            ? "bg-[rgba(236,72,153,0.40)] text-[#DB2777] border-[#DB2777] dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-transparent dark:border-amber-500 dark:text-white"
            : "hover:bg-[rgba(236,72,153,0.30)] hover:text-[#EC4899] dark:hover:bg-[rgba(255,110,180,0.12)] dark:hover:text-[#FF6EB4]";
        case "community":
          return isActiveNow
            ? "bg-[rgba(234,88,12,0.40)] text-[#EA580C] border-[#C2410C] dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-transparent dark:border-amber-500 dark:text-white"
            : "hover:bg-[rgba(234,88,12,0.30)] hover:text-[#EA580C] dark:hover:bg-[rgba(255,150,80,0.12)] dark:hover:text-[#FF9650]";
        default:
          return isActiveNow
            ? "bg-slate-200 text-slate-900 border-slate-600 dark:bg-white/10 dark:text-white"
            : `${baseHoverLight} hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white`;
      }
    };

    const variantClasses = getVariantClasses(variant, active);

    const baseStyle = `
      relative flex items-center px-4 py-3 my-1 transition-all duration-200 ease-out group/item overflow-hidden
      ${
        active
          ? "border-l-[3px] dark:border-l-2 font-bold"
          : "border-l-[3px] border-transparent dark:border-l-2 text-[#374151] dark:text-slate-400 font-semibold"
      }
      ${variantClasses}
      ${
        active && !premium && !restricted
          ? "dark:shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          : ""
      }
      ${active && premium ? "dark:shadow-[0_0_20px_rgba(245,158,11,0.15)]" : ""}
      ${restricted ? "opacity-70 saturate-50 cursor-not-allowed" : ""}
      md:justify-center md:group-hover:justify-start
    `;

    return (
      <Link
        to={to}
        onClick={handleClick}
        className={baseStyle}
        aria-disabled={restricted}
        title={restricted ? "Recurso bloqueado no seu plano" : undefined}
      >
        {/* Bloqueio clicável (mantém casca, mas permite abrir modal) */}
        {restricted && (
          <div
            className="absolute inset-0 bg-white/55 dark:bg-slate-900/50 backdrop-blur-[1.5px]"
            aria-hidden
          />
        )}

        {/* Nag de primeira visita */}
        {showNag && (
          <span className="absolute -left-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-400 via-red-500 to-rose-500 text-white text-[10px] font-black rounded-full px-2 py-1 shadow-lg ring-2 ring-amber-100/70">
            !
          </span>
        )}

        {/* Icon Wrapper */}
        <div
          className={`relative z-10 flex-shrink-0 transition-transform duration-300 ${
            active ? "scale-110" : "group-hover/item:scale-105"
          }`}
        >
          <Icon
            size={22}
            className={`
              transition-colors duration-200
              ${
                !active
                  ? "text-[#4B5563] group-hover/item:text-current dark:text-slate-400"
                  : ""
              }
              ${active && premium ? "dark:text-amber-400" : ""}
              ${active && !premium ? "dark:text-blue-400" : ""}
            `}
            strokeWidth={active ? 2.5 : 2}
          />
          {active && (
            <div
              className={`hidden dark:block absolute inset-0 blur-md opacity-50 ${
                premium ? "bg-amber-400" : "bg-blue-500"
              }`}
            />
          )}
        </div>

        {/* Label Container */}
        <span
          className={`
            relative z-10 whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
            text-sm tracking-wide ml-4
            md:ml-0 md:w-0 md:opacity-0 
            md:group-hover:ml-4 md:group-hover:w-auto md:group-hover:opacity-100
          `}
        >
          {label}
        </span>

        {/* Indicadores à direita */}
        {premium && (
          <Crown
            size={14}
            className={`
              text-[#FACC15] absolute right-4 drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]
              md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300
            `}
          />
        )}

        {restricted && (
          <Lock
            size={14}
            className="relative z-10 ml-auto mr-4 text-slate-500 dark:text-slate-300 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
          />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Upgrade Modal */}
      {upgradeInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-950/30 dark:bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setUpgradeInfo(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#0B0E14] shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                  <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#111827] dark:text-white">
                    Recurso bloqueado
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span className="font-bold">{upgradeInfo.feature}</span>{" "}
                    exige{" "}
                    <span className="font-bold">{upgradeInfo.required}</span>.
                    Seu plano:{" "}
                    <span className="font-bold">{upgradeInfo.current}</span>.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setUpgradeInfo(null)}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              {/* Ajuste a rota se seu app usar outra (ex: /plans) */}
              <Link
                to="/pricing"
                onClick={() => {
                  setUpgradeInfo(null);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold
                  bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg
                  hover:brightness-105 active:brightness-95 transition"
              >
                Ver planos <ArrowUpRight size={16} />
              </Link>

              <button
                onClick={() => setUpgradeInfo(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold border border-[#E5E7EB] dark:border-white/10
                  text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/20 dark:bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 h-full 
          bg-[#FDFDFE] border-r border-[#D1D5DB] shadow-[0_4px_20px_rgba(0,0,0,0.08)]
          dark:bg-[#0B0E14] dark:border-white/5 dark:shadow-none
          flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group
          w-64 ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 md:static md:w-20 md:hover:w-64
        `}
      >
        {/* Header */}
        <div className="h-24 flex items-center px-6 border-b border-[#D1D5DB] dark:border-white/5 relative overflow-hidden flex-shrink-0">
          {/* Logo Area */}
          <div className="flex items-center gap-3 transition-all duration-300 w-full md:justify-center md:group-hover:justify-start">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-10 rounded-full" />
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-2 relative shadow-lg shadow-blue-900/20 border border-white/10">
                <BrainCircuit className="text-white h-6 w-6" />
              </div>
            </div>

            {/* App Name */}
            <div
              className={`
                whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100
              `}
            >
              <h1 className="text-xl font-bold text-[#111827] dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-slate-400 dark:bg-clip-text leading-none ml-1 tracking-tight">
                FocusPro
              </h1>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden absolute right-4 text-[#6B7280] hover:text-[#111827] dark:text-slate-500 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Plan Badge (Compact Cakto Style) */}
        <div
          className={`
            px-3 py-6 transition-all duration-500 overflow-hidden whitespace-nowrap flex-shrink-0
            md:h-0 md:py-0 md:opacity-0 
            md:group-hover:h-auto md:group-hover:py-6 md:group-hover:opacity-100
          `}
        >
          <div
            className={`
              relative w-full rounded-xl p-3 flex items-center gap-3 border shadow-sm dark:shadow-none
              ${planStyle.container}
            `}
          >
            <div
              className={`p-1.5 rounded-lg bg-white/20 dark:bg-black/20 ${planStyle.iconColor}`}
            >
              <Sparkles size={16} fill="currentColor" className="opacity-90" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-[10px] uppercase font-bold opacity-80 leading-none mb-0.5 ${planStyle.text}`}
              >
                Seu Plano
              </span>
              <span
                className={`text-sm font-extrabold tracking-wide leading-none ${planStyle.text}`}
              >
                {planStyle.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Scroll Area */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#D1D5DB] dark:scrollbar-thumb-slate-700">
          <div
            className={`
              text-[10px] font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-4 mt-2 whitespace-nowrap transition-all duration-300
              md:opacity-0 md:group-hover:opacity-100 md:text-center md:group-hover:text-left
            `}
          >
            Principal
          </div>

          {user.role === UserRole.ADMIN && (
            <NavItem
              to="/admin"
              icon={ShieldAlert}
              label="Administração"
              variant="admin"
            />
          )}

          <NavItem
            to="/"
            icon={LayoutDashboard}
            label="Dashboard"
            variant="dashboard"
          />

          <div
            className={`
              mt-8 text-[10px] font-bold text-[#6B7280] dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-4 whitespace-nowrap transition-all duration-300
              md:opacity-0 md:group-hover:opacity-100 md:text-center md:group-hover:text-left
            `}
          >
            Ferramentas
          </div>

          <NavItem
            to="/pomodoro"
            icon={Clock}
            label="Modo Foco"
            restricted={user.plan === PlanTier.BASIC}
            premium={user.plan !== PlanTier.BASIC}
            requiredPlan={PlanTier.PRO}
            variant="focus"
          />

          <NavItem
            to="/resources"
            icon={BookOpen}
            label="Materiais & Aulas"
            restricted={user.plan === PlanTier.BASIC}
            premium={user.plan !== PlanTier.BASIC}
            requiredPlan={PlanTier.PRO}
            variant="resources"
          />

          <NavItem
            to="/journal"
            icon={Book}
            label="Diário Emocional"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
            requiredPlan={PlanTier.PREMIUM}
            variant="journal"
          />

          <NavItem
            to="/community"
            icon={Users}
            label="Comunidade"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
            requiredPlan={PlanTier.PREMIUM}
            variant="community"
          />
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#D1D5DB] dark:border-white/5 space-y-2 bg-[#F9FAFB] dark:bg-[#0B0E14]/50 backdrop-blur-md">
          <button
            onClick={toggleTheme}
            className={`
              flex items-center px-4 py-3 text-[#374151] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white transition-all duration-300 w-full rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-white/5 border border-transparent hover:border-[#E5E7EB] dark:hover:border-white/5
              md:justify-center md:group-hover:justify-start group/action
            `}
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
          >
            <div className="relative">
              {theme === "light" ? (
                <Moon
                  size={20}
                  className="group-hover/action:scale-110 transition-transform"
                />
              ) : (
                <Sun
                  size={20}
                  className="group-hover/action:scale-110 transition-transform"
                />
              )}
              <div className="hidden dark:block absolute inset-0 bg-white/20 blur-md opacity-0 group-hover/action:opacity-100 transition-opacity" />
            </div>

            <span
              className={`
                whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                ml-3 md:ml-0 md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 md:group-hover:ml-3
                text-sm font-bold text-[#374151] dark:font-medium dark:text-slate-400
              `}
            >
              {theme === "light" ? "Modo Escuro" : "Modo Claro"}
            </span>
          </button>

          <button
            onClick={AuthService.logout}
            className={`
              flex items-center px-4 py-3 text-[#374151] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20
              md:justify-center md:group-hover:justify-start group/action
            `}
            title="Sair"
          >
            <div className="relative">
              <LogOut
                size={20}
                className="group-hover/action:scale-110 transition-transform"
              />
            </div>
            <span
              className={`
                whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
                ml-3 md:ml-0 md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 md:group-hover:ml-3
                text-sm font-bold text-[#374151] dark:font-medium dark:text-slate-400
              `}
            >
              Sair
            </span>
          </button>
        </div>
      </div>
    </>
  );
};
