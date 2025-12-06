import { User } from "../../../FocusProBackend/src/types";
import { supabase } from "./supabase";

export const AuthService = {
  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Senha é obrigatória");

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    console.log(authData);

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Usuário não encontrado");

    // Fetch profile data (role, plan, name)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();
    console.log(profileError);
    if (profileError) throw new Error("Erro ao carregar perfil do usuário");

    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      name: profile.name,
      role: profile.role,
      plan: profile.plan,
      joinedDate: profile.created_at,
      authProvider: "email",
    };

    localStorage.setItem("focuspro_current_user", JSON.stringify(user));
    return user;
  },

  loginWithGoogle: async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Metadata passed to trigger if set up in DB
      },
    });
    if (error) throw new Error(error.message);

    // Manually insert profile if no trigger exists (fallback)
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        name: name,
        role: "USER",
        plan: "Basic",
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("focuspro_current_user");
    window.location.href = "/#/login";
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem("focuspro_current_user");
    return stored ? JSON.parse(stored) : null;
  },

  // Sync session with Supabase
  refreshSession: async (): Promise<User | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      localStorage.removeItem("focuspro_current_user");
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        name: profile.name,
        role: profile.role,
        plan: profile.plan,
        joinedDate: profile.created_at,
        authProvider:
          session.user.app_metadata.provider === "google" ? "google" : "email",
      };
      localStorage.setItem("focuspro_current_user", JSON.stringify(user));
      return user;
    }
    return null;
  },
};
