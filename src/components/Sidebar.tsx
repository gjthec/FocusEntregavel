import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, UserRole, PlanTier } from "../types";
import { AuthService } from "../services/authService";
import {
  LayoutDashboard,
  Clock,
  BookOpen,
  Book,
  ShieldAlert,
  LogOut,
  Crown,
  BrainCircuit,
  Lock,
  ArrowUpRight,
  X,
  Users, // Added icon
} from "lucide-react";

const planStyles: Record<
  PlanTier,
  {
    icon: string;
    gradient: string;
    glow: string;
    accent: string;
    halo: string;
    textClass: string;
  }
> = {
  [PlanTier.PREMIUM]: {
    icon: "/Premium.png",
    gradient: "linear-gradient(135deg, #ECD782 0%, #CBA753 45%, #A67C34 100%)",
    glow: "0 12px 40px rgba(166, 124, 52, 0.35)",
    accent: "#CBA753",
    halo: "rgba(236, 215, 130, 0.35)",
    textClass: "text-amber-950",
  },
  [PlanTier.PRO]: {
    icon: "/Pro.png",
    gradient: "linear-gradient(135deg, #46196F 0%, #7035A4 50%, #A762D7 100%)",
    glow: "0 12px 40px rgba(70, 25, 111, 0.35)",
    accent: "#7035A4",
    halo: "rgba(167, 98, 215, 0.35)",
    textClass: "text-purple-50",
  },
  [PlanTier.BASIC]: {
    icon: "/Basic.png",
    gradient: "linear-gradient(135deg, #0F0F1C 0%, #052040 30%, #0E4B96 60%, #0066CC 85%, #42A3FF 100%)",
    glow: "0 12px 40px rgba(14, 75, 150, 0.35)",
    accent: "#42A3FF",
    halo: "rgba(66, 163, 255, 0.35)",
    textClass: "text-blue-50",
  },
};

const PlanBadge: React.FC<{ plan: PlanTier }> = ({ plan }) => {
  const style = planStyles[plan];

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/30 dark:border-white/10 shadow-lg"
      style={{ background: style.gradient, boxShadow: style.glow }}
    >
      <div
        className="absolute inset-0 blur-2xl opacity-60"
        style={{ background: `radial-gradient(circle at 25% 25%, ${style.halo}, transparent 55%)` }}
      />
      <div className="relative flex items-center gap-3 p-3">
        <div
          className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden"
        >
          <img
            src={style.icon}
            alt={`${plan} icon`}
            className="block h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">Plano</p>
          <p className={`text-lg font-extrabold leading-tight ${style.textClass}`}>{plan}</p>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const location = useLocation();
  const [navVisits, setNavVisits] = useState<Record<string, boolean>>({});
  const [upgradeInfo, setUpgradeInfo] = useState<
    { feature: string; required: PlanTier; current: PlanTier } | null
  >(null);

  useEffect(() => {
    const key = `focuspro_nav_visits_${user.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setNavVisits(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse nav visits", error);
      }
    }
  }, [user.id]);

  const persistVisits = (updated: Record<string, boolean>) => {
    const key = `focuspro_nav_visits_${user.id}`;
    setNavVisits(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  useEffect(() => {
    if (!navVisits[location.pathname]) {
      persistVisits({ ...navVisits, [location.pathname]: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const nextPlanFor = useMemo(() => {
    return {
      [PlanTier.BASIC]: PlanTier.PRO,
      [PlanTier.PRO]: PlanTier.PREMIUM,
      [PlanTier.PREMIUM]: PlanTier.PREMIUM,
    } as const;
  }, []);

  const NavItem = ({
    to,
    icon: Icon,
    label,
    restricted,
    premium,
    requiredPlan,
  }: {
    to: string;
    icon: any;
    label: string;
    restricted?: boolean;
    premium?: boolean;
    requiredPlan?: PlanTier;
  }) => {
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

      if (!navVisits[to]) {
        persistVisits({ ...navVisits, [to]: true });
      }
      onClose();
    };

    return (
      <Link
        to={to}
        onClick={handleClick}
        className={`
        relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 group/item mb-1 overflow-hidden
        ${
          isActive(to)
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }
        ${restricted ? "saturate-50" : ""}
        md:justify-center md:group-hover:justify-start
      `}
      >
        {restricted && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/60 backdrop-blur-[1.5px]" aria-hidden />
        )}

        {showNag && (
          <span
            className="absolute -left-2 top-1/2 -translate-y-1/2 bg-gradient-to-br from-amber-400 via-red-500 to-rose-500 text-white text-[10px] font-black rounded-full px-2 py-1 shadow-lg ring-2 ring-amber-100/70"
          >
            !
          </span>
        )}

        <Icon
          size={22}
          className={`flex-shrink-0 transition-colors ${
            premium ? "text-amber-500" : ""
          }`}
        />

      {/* Label Container - Hidden on Desktop Collapsed, Shown on Hover */}
      <span
        className={`
        whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
        /* Mobile: Always Visible */
        ml-3
        /* Desktop: Width 0 -> Auto */
        md:ml-0 md:w-0 md:opacity-0 
        md:group-hover:ml-3 md:group-hover:w-auto md:group-hover:opacity-100
      `}
      >
        {label}
      </span>

      {premium && (
        <Crown
          size={14}
          className={`
          text-amber-500 absolute right-4
          /* Desktop Logic: Hidden collapsed, Visible expanded */
          md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300
        `}
        />
      )}

      {restricted && (
        <div className="absolute right-4 flex items-center gap-1 text-slate-500 dark:text-slate-300 text-xs font-semibold">
          <Lock size={14} />
          <span className="hidden md:inline">Exclusivo</span>
        </div>
      )}
    </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay/Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
        flex flex-col shadow-xl md:shadow-none transition-all duration-300 ease-in-out group
        
        /* Mobile: Width 64 (256px), controlled by isOpen prop */
        w-64 ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        
        /* Desktop: Always visible, starts collapsed (w-20), expands on hover (w-64) */
        md:translate-x-0 md:static md:w-20 md:hover:w-64
      `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center md:justify-center md:group-hover:justify-start overflow-hidden h-20">
          <div className="flex items-center gap-2 transition-all duration-300">
            <div className="bg-blue-600 rounded-lg p-1.5 flex-shrink-0">
              <BrainCircuit className="text-white h-6 w-6" />
            </div>

            {/* App Name: Hidden on collapsed desktop */}
            <div
              className={`
              whitespace-nowrap overflow-hidden transition-all duration-300
              md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100
            `}
            >
              <h1 className="text-xl font-bold text-slate-800 dark:text-white leading-none ml-2">
                FocusPro
              </h1>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Plan Badge (Desktop: Hides when collapsed) */}
        <div
          className={`
          px-6 py-4 transition-all duration-300 overflow-hidden whitespace-nowrap
          md:h-0 md:py-0 md:opacity-0
          md:group-hover:h-auto md:group-hover:py-4 md:group-hover:opacity-100
        `}
        >
          <button
            type="button"
            onClick={() => {
              if (user.plan !== PlanTier.PREMIUM) {
                setUpgradeInfo({
                  feature: "Seu plano",
                  required: nextPlanFor[user.plan],
                  current: user.plan,
                });
              }
            }}
            className="w-full text-left focus:outline-none"
          >
            <PlanBadge plan={user.plan} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-1">
          {/* Section Label */}
          <div
            className={`
            text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4 mt-2 whitespace-nowrap transition-all duration-300
            md:opacity-0 md:group-hover:opacity-100
          `}
          >
            Principal
          </div>

          {user.role === UserRole.ADMIN && (
            <NavItem to="/admin" icon={ShieldAlert} label="Administração" />
          )}

          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />

          <div
            className={`
            mt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-4 whitespace-nowrap transition-all duration-300
            md:opacity-0 md:group-hover:opacity-100
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
          />

          <NavItem
            to="/resources"
            icon={BookOpen}
            label="Materiais & Aulas"
            restricted={user.plan === PlanTier.BASIC}
            premium={user.plan !== PlanTier.BASIC}
            requiredPlan={PlanTier.PRO}
          />

          <NavItem
            to="/journal"
            icon={Book}
            label="Diário Emocional"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
            requiredPlan={PlanTier.PREMIUM}
          />

          <NavItem
            to="/community"
            icon={Users}
            label="Comunidade"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
            requiredPlan={PlanTier.PREMIUM}
          />
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
          <button
            onClick={AuthService.logout}
            className={`
              flex items-center px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20
              md:justify-center md:group-hover:justify-start
            `}
            title="Sair"
          >
            <LogOut size={22} className="flex-shrink-0" />
            <span
              className={`
              whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
              ml-3 md:ml-0 md:w-0 md:opacity-0 md:group-hover:w-auto md:group-hover:opacity-100 md:group-hover:ml-3
            `}
            >
              Sair
            </span>
          </button>
        </div>
      </div>

      {upgradeInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-blue-100 dark:border-slate-700">
            <button
              onClick={() => setUpgradeInfo(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                <Lock />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-400">Upgrade necessário</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Desbloqueie {upgradeInfo.feature}</h3>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Seu plano atual ({upgradeInfo.current}) não inclui este recurso. Faça o upgrade para o plano {upgradeInfo.required} e libere tudo agora.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg"
                onClick={() => {
                  setUpgradeInfo(null);
                  alert("Upgrade de plano solicitado! Nossa equipe entrará em contato.");
                }}
              >
                <span>Quero fazer upgrade</span>
                <ArrowUpRight size={16} />
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                onClick={() => setUpgradeInfo(null)}
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
