import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SHEET_ID = "1TW5An2VJoTgpXV8Me--_1g1ag1rLI44L7NHkVX_wgRk";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const RANGE = "Medicoes!A2:H10000";

const VALID_CTX = new Set([
  "jejum",
  "pre-refeicao",
  "pos-refeicao",
  "antes-dormir",
  "aleatorio",
]);

const recordSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  valor: z.number().min(20).max(600),
  contexto: z.string().optional().nullable(),
  insulina: z.number().nullable().optional(),
  refeicao: z.string().max(200).nullable().optional(),
  observacoes: z.string().max(500).nullable().optional(),
});

async function insertWithDedupe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeClient: any,
  writeUserId: string,
  records: Array<{
    user_id: string;
    data: string;
    hora: string;
    valor: number;
    contexto: string;
    insulina: number | null;
    refeicao: string | null;
    observacoes: string | null;
  }>,
) {
  if (records.length === 0) return { inserted: 0, total: 0 };
  const { data: existing, error: exErr } = await writeClient
    .from("measurements")
    .select("data, hora, valor")
    .eq("user_id", writeUserId);
  if (exErr) throw new Error(`Falha ao ler existentes: ${exErr.message}`);
  const seen = new Set(
    ((existing as Array<{ data: string; hora: string; valor: number }> | null) ?? []).map(
      (r) => `${r.data}|${r.hora}|${r.valor}`,
    ),
  );
  const fresh = records.filter(
    (r) => !seen.has(`${r.data}|${r.hora}|${r.valor}`),
  );
  if (fresh.length === 0) return { inserted: 0, total: records.length };
  let inserted = 0;
  for (let i = 0; i < fresh.length; i += 500) {
    const batch = fresh.slice(i, i + 500);
    const { error } = await writeClient.from("measurements").insert(batch);
    if (error) throw new Error(`Insert falhou: ${error.message}`);
    inserted += batch.length;
  }
  return { inserted, total: records.length };
}

export const importMeasurementRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        targetUserId: z.string().uuid().optional(),
        rows: z.array(recordSchema).min(1).max(20000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let writeClient: typeof supabase = supabase;
    let writeUserId = userId;
    if (data.targetUserId && data.targetUserId !== userId) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) throw new Error("Acesso negado");
      writeClient = supabaseAdmin as unknown as typeof supabase;
      writeUserId = data.targetUserId;
    }
    const records = data.rows.map((r) => {
      const ctx = (r.contexto ?? "aleatorio") as string;
      return {
        user_id: writeUserId,
        data: r.data,
        hora: r.hora.length === 5 ? `${r.hora}:00` : r.hora,
        valor: r.valor,
        contexto: VALID_CTX.has(ctx) ? ctx : "aleatorio",
        insulina: r.insulina ?? null,
        refeicao: r.refeicao ?? null,
        observacoes: r.observacoes ?? null,
      };
    });
    return insertWithDedupe(writeClient, writeUserId, records);
  });

export const importFromSheets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ targetUserId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Se admin enviou targetUserId, importa para outra conta usando service role
    let writeClient: typeof supabase = supabase;
    let writeUserId = userId;
    if (data.targetUserId && data.targetUserId !== userId) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) throw new Error("Acesso negado");
      writeClient = supabaseAdmin as unknown as typeof supabase;
      writeUserId = data.targetUserId;
    }

    const lov = process.env.LOVABLE_API_KEY;
    const key = process.env.GOOGLE_SHEETS_API_KEY;
    if (!lov || !key) throw new Error("Credenciais do Google Sheets ausentes");

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${RANGE}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lov}`,
        "X-Connection-Api-Key": key,
      },
    });
    if (!res.ok) {
      throw new Error(`Sheets falhou [${res.status}]: ${await res.text()}`);
    }
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];

    const records = rows
      .filter((r) => r[0] && r[2])
      .map((r) => {
        const ctx = (r[3] ?? "aleatorio") as string;
        return {
          user_id: writeUserId,
          data: r[0],
          hora: (r[1] ?? "00:00").length === 5 ? r[1] + ":00" : r[1],
          valor: Number(r[2]),
          contexto: VALID_CTX.has(ctx) ? ctx : "aleatorio",
          insulina: r[4] ? Number(r[4]) : null,
          refeicao: r[5] || null,
          observacoes: r[6] || null,
        };
      })
      .filter((r) => Number.isFinite(r.valor) && r.valor >= 20 && r.valor <= 600);

    return insertWithDedupe(writeClient, writeUserId, records);
  });