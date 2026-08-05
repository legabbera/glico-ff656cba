import { createStart, createMiddleware } from "@tanstack/react-start";

import { getRequestHeader } from "@tanstack/react-start/server";
import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "./integrations/supabase/auth-attacher";

const csrfMiddleware = createMiddleware().server(async ({ next }) => {
  const origin = getRequestHeader("origin");
  const host = getRequestHeader("host");
  
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        throw new Error("CSRF block: Origin does not match Host");
      }
    } catch (e) {
      // Ignorar erros de parse de URL inválida e prosseguir bloqueando se for o caso
    }
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [csrfMiddleware, attachSupabaseAuth],
}));
