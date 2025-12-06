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

// Optional service-role client for privileged admin actions (e.g., listing all users)
// Only initialized when a service key is provided in the environment.
const supabaseServiceKey =
  getEnv("VITE_SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
