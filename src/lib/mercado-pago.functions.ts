import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLAN_PRICE_BRL } from "./access.functions";

export const createMercadoPagoPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, userEmail } = context;
    const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!mpAccessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado nas variáveis de ambiente.");
    }

    // Usar localhost por padrão ou a URL da aplicação em produção
    const baseUrl = process.env.APP_URL || "http://localhost:8080";

    const body = {
      items: [
        {
          id: "gllico_pro_mensal",
          title: "Gllico Pro — Diário de Glicemia (Mensal)",
          quantity: 1,
          unit_price: PLAN_PRICE_BRL,
          currency_id: "BRL"
        }
      ],
      payer: {
        email: userEmail || undefined
      },
      external_reference: userId,
      back_urls: {
        success: `${baseUrl}/registrar`,
        pending: `${baseUrl}/planos`,
        failure: `${baseUrl}/planos`
      },
      auto_return: "approved"
    };

    try {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API do Mercado Pago: ${errorText}`);
      }

      const data = await response.json();
      return { initPoint: data.init_point, preferenceId: data.id };
    } catch (error) {
      console.error("Erro ao criar preferência do Mercado Pago:", error);
      throw new Error((error as Error).message || "Falha ao iniciar pagamento");
    }
  });
