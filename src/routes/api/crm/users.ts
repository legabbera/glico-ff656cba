import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute("/api/crm/users")({
  GET: async ({ request }) => {
    try {
      // Validar token de acesso do CRM via cabeçalho Authorization: Bearer <token>
      const authHeader = request.headers.get("Authorization");
      const crmToken = process.env.CRM_API_TOKEN;

      if (!crmToken || authHeader !== `Bearer ${crmToken}`) {
        return new Response(JSON.stringify({ error: "Unauthorized. Invalid or missing token." }), { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: "Configuration error (missing DB credentials)" }), { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        });
      }

      // Inicializar o Supabase com Service Role para bypass de RLS e buscar todos os usuários
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, diabetes_type, is_active, is_admin, free_access, subscription_status, subscription_active_until, created_at, trial_days_left")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users for CRM:", error);
        return new Response(JSON.stringify({ error: "Database query error" }), { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        });
      }

      return new Response(JSON.stringify({
        total: profiles.length,
        users: profiles
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });

    } catch (err) {
      console.error("CRM API error:", err);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }
  },
});
