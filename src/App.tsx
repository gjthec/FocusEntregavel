import React, { useState, useEffect, useContext, createContext } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Login } from "./pages/Login";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Pomodoro } from "./pages/Pomodoro";
import { Journal } from "./pages/Journal";
import { Sidebar } from "./components/Sidebar";
import { AuthService } from "./services/authService";
import { UserRole, PlanTier } from "./types";
import { Resources } from "./pages/Resources";
import { Community } from "./pages/Community";
import { Menu, Loader2 } from "lucide-react";

// --- Theme Context ---
type Theme = "light" | "dark";
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

const ProtectedRoute = ({
  children,
  roleRequired,
  planRequired,
}: {
  children?: React.ReactNode;
  roleRequired?: UserRole;
  planRequired?: PlanTier;
}) => {
  const user = AuthService.getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  // Plan hierarchy check: Premium > Pro > Basic
  if (planRequired) {
    const planLevels = {
      [PlanTier.BASIC]: 1,
      [PlanTier.PRO]: 2,
      [PlanTier.PREMIUM]: 3,
    };
    const userLevel = planLevels[user.plan];
    const requiredLevel = planLevels[planRequired];

    if (userLevel < requiredLevel) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-[#0B0E14]">
          <div className="text-center p-8 bg-white dark:bg-[#121620] shadow-lg rounded-2xl max-w-md border border-slate-100 dark:border-white/10">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
              Funcionalidade Bloqueada
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Esta funcionalidade requer o plano{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {planRequired}
              </span>{" "}
              ou superior.
            </p>
            <a
              href="/#/"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const user = AuthService.getCurrentUser();
  const { theme } = useContext(ThemeContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Apply theme class to HTML element
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100 transition-colors duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
      {user && (
        <Sidebar
          user={user}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto relative w-full scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
        {/* Mobile Header with Hamburger */}
        {user && (
          <div className="md:hidden p-4 pb-0 flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white dark:bg-[#121620] rounded-lg shadow-sm border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg text-slate-800 dark:text-white">
              FocusPro
            </span>
          </div>
        )}

        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  // ✅ Frontend (tema com toggle + persistência)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("focuspro_theme");
    return (saved as Theme) || "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("focuspro_theme", newTheme);
      return newTheme;
    });
  };

  // ✅ Regra de negócio (sync de sessão + loading)
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    AuthService.refreshSession()
      .catch(() => undefined)
      .finally(() => setAuthLoading(false));
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0B0E14]">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roleRequired={UserRole.ADMIN}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pomodoro"
              element={
                <ProtectedRoute planRequired={PlanTier.PRO}>
                  <Pomodoro />
                </ProtectedRoute>
              }
            />

            <Route
              path="/resources"
              element={
                <ProtectedRoute planRequired={PlanTier.PRO}>
                  <Resources />
                </ProtectedRoute>
              }
            />

            <Route
              path="/journal"
              element={
                <ProtectedRoute planRequired={PlanTier.PREMIUM}>
                  <Journal />
                </ProtectedRoute>
              }
            />

            <Route
              path="/community"
              element={
                <ProtectedRoute planRequired={PlanTier.PREMIUM}>
                  <Community />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ThemeContext.Provider>
  );
};

export default App;
