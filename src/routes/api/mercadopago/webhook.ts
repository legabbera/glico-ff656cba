import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute("/api/mercadopago/webhook")({
  POST: async ({ request }) => {
    try {
      const url = new URL(request.url);
      
      // O Mercado Pago pode enviar dados como query string (topic e id) ou no body
      let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
      let type = url.searchParams.get("type") || url.searchParams.get("topic");

      // Tenta extrair do body caso não esteja na URL
      if (!paymentId) {
        try {
          const body = await request.clone().json();
          if (body.type === "payment" || body.action === "payment.created") {
            paymentId = body.data?.id;
          }
        } catch {
          // Body pode estar vazio
        }
      }

      if (!paymentId) {
        return new Response("No payment ID provided", { status: 400 });
      }

      const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("MERCADO_PAGO_ACCESS_TOKEN is missing");
        return new Response("Configuration error", { status: 500 });
      }

      // Buscar os detalhes do pagamento na API do MP
      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      });

      if (!paymentRes.ok) {
        console.error("Failed to fetch payment details from MP");
        return new Response("Failed to fetch payment", { status: 500 });
      }

      const paymentData = await paymentRes.json();

      if (paymentData.status === "approved") {
        const userId = paymentData.external_reference;

        if (userId) {
          const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXT_SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseServiceKey) {
            console.error("Supabase service role or url missing");
            return new Response("Configuration error", { status: 500 });
          }

          // Inicializar Supabase com a chave de admin (Service Role)
          // Isso permite fazer o update ignorando o RLS, já que não temos sessão de usuário na requisição
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // Adiciona 30 dias a partir de agora
          const activeUntil = new Date();
          activeUntil.setDate(activeUntil.getDate() + 30);

          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_active_until: activeUntil.toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Error updating user profile:", error);
            return new Response("Error updating profile", { status: 500 });
          }
          console.log(`Payment approved! Profile for user ${userId} updated.`);
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});
