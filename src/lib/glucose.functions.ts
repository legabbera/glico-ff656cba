import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ContextoEnum = z.enum([
  "jejum",
  "pre-refeicao",
  "pos-refeicao",
  "antes-dormir",
  "aleatorio",
]);

export const MeasurementSchema = z
  .object({
    data: z.string().min(1).max(20),
    hora: z.string().min(1).max(10).nullable().optional(),
    valor: z.number().min(20).max(600).nullable().optional(),
    contexto: ContextoEnum.nullable().optional(),
    insulina: z.number().min(0).max(200).optional().nullable(),
    refeicao: z.string().max(120).optional().nullable(),
    observacoes: z.string().max(500).optional().nullable(),
    semMedicao: z.boolean().optional().default(false),
  })
  .refine((v) => v.semMedicao || (typeof v.valor === "number" && v.valor >= 20), {
    message: "Informe um valor de glicose ou marque 'sem medição'.",
    path: ["valor"],
  });

export type Contexto = z.infer<typeof ContextoEnum>;
export type Measurement = {
  id?: string;
  data: string;
  hora: string | null;
  valor: number | null;
  contexto: Contexto | null;
  insulina: number | null;
  refeicao: string | null;
  observacoes: string | null;
  semMedicao: boolean;
  criadoEm: string;
};

export const appendMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MeasurementSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("measurements").insert({
      user_id: userId,
      data: data.data,
      hora: data.hora ?? null,
      valor: data.semMedicao ? null : (data.valor ?? null),
      contexto: data.semMedicao ? null : (data.contexto ?? null),
      insulina: data.insulina ?? null,
      refeicao: data.refeicao ?? null,
      observacoes: data.observacoes ?? null,
      sem_medicao: data.semMedicao ?? false,
    });
    if (error) throw new Error(`Erro ao salvar: ${error.message}`);
    return { ok: true, criadoEm: new Date().toISOString() };
  });

export const listMeasurements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ targetUserId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;

    let query = supabase
      .from("measurements")
      .select("id, data, hora, valor, contexto, insulina, refeicao, observacoes, sem_medicao, criado_em");

    if (input.targetUserId && input.targetUserId !== userId) {
      // Admin-only: viewing another user's data
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        return { items: [] as Measurement[], error: "FORBIDDEN" as const };
      }
      query = query.eq("user_id", input.targetUserId);
    }

    const { data, error } = await query
      .order("data", { ascending: false })
      .order("hora", { ascending: false })
      .limit(5000);
    if (error) {
      console.error("Supabase list error:", error);
      return { items: [] as Measurement[], error: "SERVICE_UNAVAILABLE" as const };
    }
    const items: Measurement[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: (r.id as string | undefined) ?? undefined,
      data: r.data as string,
      hora:
        typeof r.hora === "string" ? (r.hora as string).slice(0, 5) : (r.hora as string | null),
      valor: (r.valor as number | null) ?? null,
      contexto: (r.contexto as Contexto | null) ?? null,
      insulina: (r.insulina as number | null) ?? null,
      refeicao: (r.refeicao as string | null) ?? null,
      observacoes: (r.observacoes as string | null) ?? null,
      semMedicao: Boolean(r.sem_medicao),
      criadoEm: (r.criado_em as string | null) ?? "",
    }));
    return { items, error: null as null | "SERVICE_UNAVAILABLE" | "FORBIDDEN" };
  });

export const updateMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        patch: MeasurementSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const p = data.patch;
    const { error } = await supabase
      .from("measurements")
      .update({
        data: p.data,
        hora: p.hora ?? null,
        valor: p.semMedicao ? null : (p.valor ?? null),
        contexto: p.semMedicao ? null : (p.contexto ?? null),
        insulina: p.insulina ?? null,
        refeicao: p.refeicao ?? null,
        observacoes: p.observacoes ?? null,
        sem_medicao: p.semMedicao ?? false,
      })
      .eq("id", data.id);
    if (error) throw new Error(`Erro ao atualizar: ${error.message}`);
    return { ok: true };
  });

export const deleteMeasurement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("measurements").delete().eq("id", data.id);
    if (error) throw new Error(`Erro ao apagar: ${error.message}`);
    return { ok: true };
  });