import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXT_SUPABASE_URL ?? "https://iimjjkqzgptmmroyxsuv.supabase.co";
const anonKey =
  process.env.EXT_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbWpqa3F6Z3B0bW1yb3l4c3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjMzNjksImV4cCI6MjA5NTEzOTM2OX0.DZ2B55Urmp_M-kBnl6g4GWblokwD2w2V5BBsTd5uVJQ";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const authHeader = getRequestHeader("authorization");
    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid token");
    }
    return next({
      context: {
        supabase,
        userId: data.user.id,
        userEmail: data.user.email ?? null,
      },
    });
  },
);