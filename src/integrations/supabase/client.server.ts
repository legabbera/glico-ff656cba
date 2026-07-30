import { createClient } from "@supabase/supabase-js";

const url = process.env.EXT_SUPABASE_URL ?? "https://iimjjkqzgptmmroyxsuv.supabase.co";
const serviceKey = process.env.EXT_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.warn("EXT_SUPABASE_SERVICE_ROLE_KEY ausente — admin client não funcionará");
}

export const supabaseAdmin = createClient(url, serviceKey ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});