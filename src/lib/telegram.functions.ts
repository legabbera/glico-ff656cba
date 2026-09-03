import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const sendTelegramMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("E-mail inválido"),
        whatsapp: z.string().optional(),
        assunto: z.string().min(1, "Assunto é obrigatório"),
        mensagem: z.string().min(5, "A mensagem deve ter pelo menos 5 caracteres"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      throw new Error("As credenciais do Telegram não estão configuradas no servidor.");
    }

    const text = `
📬 <b>Novo Contato (Gllico)</b>
<b>Nome:</b> ${data.nome}
<b>E-mail:</b> ${data.email}
<b>WhatsApp:</b> ${data.whatsapp || "Não informado"}
<b>Assunto:</b> ${data.assunto}

<b>Mensagem:</b>
${data.mensagem}
    `.trim();

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Erro no Telegram:", errText);
      throw new Error("Falha ao enviar mensagem para o Telegram.");
    }

    return { success: true };
  });
