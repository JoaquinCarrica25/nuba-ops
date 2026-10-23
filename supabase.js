// ============================================================
// Nuba Ops — Cliente Supabase
// ============================================================
// Si existen las variables de entorno, la app usa Supabase.
// Si no, funciona en modo demo con datos locales.
//
// VITE_SUPABASE_URL=https://xxxx.supabase.co
// VITE_SUPABASE_ANON_KEY=eyJ...
// ============================================================

import { createClient } from "@supabase/supabase-js";

let cliente = null;

export function getSupabase() {
  if (cliente) return cliente;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  cliente = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "nuba-ops-session",
    },
  });
  return cliente;
}
