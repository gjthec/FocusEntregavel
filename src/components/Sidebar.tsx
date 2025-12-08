import React from "react";
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
  X,
  Users, // Added icon
} from "lucide-react";

interface SidebarProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({
    to,
    icon: Icon,
    label,
    restricted,
    premium,
  }: {
    to: string;
    icon: any;
    label: string;
    restricted?: boolean;
    premium?: boolean;
  }) => (
    <Link
      to={to}
      onClick={onClose}
      className={`
        relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 group/item mb-1
        ${
          isActive(to)
            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        }
        ${restricted ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        /* Mobile: Default Left Align */
        /* Desktop: Center by default (collapsed), Left on hover (expanded) */
        md:justify-center md:group-hover:justify-start
      `}
    >
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
    </Link>
  );

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
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 text-center uppercase tracking-wide">
            Plano {user.plan}
          </div>
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
          />

          <NavItem
            to="/resources"
            icon={BookOpen}
            label="Materiais & Aulas"
            restricted={user.plan === PlanTier.BASIC}
            premium={user.plan !== PlanTier.BASIC}
          />

          <NavItem
            to="/journal"
            icon={Book}
            label="Diário Emocional"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
          />

          <NavItem
            to="/community"
            icon={Users}
            label="Comunidade"
            restricted={user.plan !== PlanTier.PREMIUM}
            premium={user.plan === PlanTier.PREMIUM}
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
    </>
  );
};
