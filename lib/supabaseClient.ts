import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !(anonKey || serviceRoleKey)) {
    throw new Error(
      "Faltan variables de entorno para Supabase. Configura NEXT_PUBLIC_SUPABASE_URL y una key."
    );
  }

  // Usa serviceRoleKey si anonKey no está disponible
  const key = anonKey || serviceRoleKey;

  const storage = typeof window !== "undefined" ? window.sessionStorage : undefined;

  return createSupabaseClient(url, key!, {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
