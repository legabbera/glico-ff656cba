import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://iimjjkqzgptmmroyxsuv.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbWpqa3F6Z3B0bW1yb3l4c3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjMzNjksImV4cCI6MjA5NTEzOTM2OX0.DZ2B55Urmp_M-kBnl6g4GWblokwD2w2V5BBsTd5uVJQ";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
    storage: isBrowser ? window.localStorage : undefined,
    storageKey: "gllico-auth",
  },
});