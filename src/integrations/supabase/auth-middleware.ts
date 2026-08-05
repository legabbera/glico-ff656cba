import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXT_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.EXT_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const authHeader = getRequestHeader("authorization");
    if (!authHeader) {
      throw new Error("Unauthorized: No authorization header provided");
    }
    if (!url || !anonKey) {
      throw new Error("Internal Server Error: Supabase connection not configured.");
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