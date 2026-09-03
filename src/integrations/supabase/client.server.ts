import { createClient } from "@supabase/supabase-js";

const url = process.env.EXT_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://iimjjkqzgptmmroyxsuv.supabase.co";
const serviceKey = process.env.EXT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY ausente — admin client não funcionará corretamente.");
}

export const supabaseAdmin = createClient(url, serviceKey || "dummy-key-to-prevent-init-crash", {
  auth: { persistSession: false, autoRefreshToken: false },
});