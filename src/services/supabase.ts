import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      const v = (import.meta as any).env[key];
      if (v) return v;
    }
  } catch {}

  try {
    if (typeof process !== "undefined" && process.env) {
      const v = process.env[key];
      if (v) return v;
    }
  } catch {}

  return undefined;
};

const supabaseUrl =
  getEnv("VITE_SUPABASE_URL") || getEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey =
  getEnv("VITE_SUPABASE_ANON_KEY") || getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL ou anon key não configurados. Verifique .env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
