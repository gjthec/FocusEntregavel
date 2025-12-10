import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../services/authService";
import { UserRole } from "../types";
import {
  BrainCircuit,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
  Heart,
  Lock,
  LogIn,
} from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log(email);
      // Logic handles both Login (if exists) and Register (if new)
      const user = await AuthService.login(email, password);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    // Simulate Google Login popup interaction
    try {
      await AuthService.loginWithGoogle();
      // Redirect happens automatically by OAuth provider
    } catch (err: any) {
      setError("Erro ao conectar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const scrollToLogin = () => {
    setShowLogin(true);
    setTimeout(() => {
      document
        .getElementById("login-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-200">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-blue-600 h-8 w-8" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            FocusPro
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Como Funciona
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Depoimentos
          </a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">
            Dúvidas
          </a>
        </div>
        <button
          onClick={() => setShowLogin(!showLogin)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
        >
          {showLogin ? "Voltar" : "Entrar / Planos"}
        </button>
      </nav>

      {/* Hero Section */}
      {!showLogin ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <span className="animate-pulse">🚀</span> Pare de lutar contra seu
            cérebro
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
            Domine o{" "}
            <span className="text-blue-600 dark:text-blue-500">
              Caos Mental
            </span>{" "}
            e<br className="hidden md:block" /> Retome o Controle.
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
            O sistema definitivo para quem sente que a vida está bagunçada, tem
            dificuldade de foco e suspeita (ou sabe) que tem TDAH. Simples,
            visual e sem julgamentos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={scrollToLogin}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Acessar Plataforma <ArrowRight size={20} />
            </button>
            <button
              onClick={scrollToLogin}
              className="w-full sm:w-auto bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all"
            >
              Ver Planos
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            ACESSO IMEDIATO • CANCELAMENTO FÁCIL • 7 DIAS GRÁTIS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {[
              {
                text: "Organize sua rotina com facilidade",
                icon: CheckCircle2,
              },
              {
                text: "Reduza a sensação de bagunça mental",
                icon: CheckCircle2,
              },
              {
                text: "Construa hábitos simples e duradouros",
                icon: CheckCircle2,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
              >
                <item.icon className="text-blue-500 flex-shrink-0" size={20} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-12 mt-16 opacity-50 grayscale">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
              <BrainCircuit /> NeuroFocus
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
              <Zap /> DailySync
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
              <Heart /> MindCare
            </div>
          </div>
        </div>
      ) : (
        /* Login / Register Section */
        <div
          id="login-section"
          className="max-w-md mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-8"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Acesse sua conta
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Escolha como deseja entrar.
              </p>
            </div>

            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 mb-6 relative"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  ou com e-mail
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Sua senha segura"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Se for seu primeiro acesso, esta senha será criada.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-medium animate-in fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Continuar com E-mail"
                )}
                {!loading && <ArrowRight size={20} />}
              </button>

              <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
                Ao continuar, você concorda com nossos Termos de Uso e Política
                de Privacidade.
                <br />
                <span className="block mt-2 font-mono bg-slate-100 dark:bg-slate-700 p-1 rounded">
                  Admin: admin@focuspro.com / admin
                </span>
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
