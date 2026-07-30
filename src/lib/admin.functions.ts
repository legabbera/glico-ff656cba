import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  console.log(`[assertAdmin] Checking user: ${userId}`);
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) {
    console.error(`[assertAdmin] DB Error:`, error);
    throw new Error(error.message);
  }
  if (!data) {
    console.warn(`[assertAdmin] Denied for ${userId}. Data is null.`);
    throw new Error("Acesso negado: requer admin");
  }
  console.log(`[assertAdmin] Success for ${userId}`);
}

export type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  diabetes_type: "tipo1" | "tipo2" | null;
  is_active: boolean;
  is_admin: boolean;
  measurements_count: number;
  last_measurement: string | null;
  free_access: boolean;
  created_at: string | null;
  trial_days_left: number;
};

export const listUsersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, diabetes_type, is_active, free_access, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    const { data: counts } = await supabaseAdmin
      .from("measurements")
      .select("user_id, data, hora");
    const byUser = new Map<string, { count: number; last: string | null }>();
    for (const m of counts ?? []) {
      const cur = byUser.get(m.user_id) ?? { count: 0, last: null };
      cur.count += 1;
      const ts = `${m.data}T${(m.hora as string) ?? "00:00"}`;
      if (!cur.last || ts > cur.last) cur.last = ts;
      byUser.set(m.user_id, cur);
    }

    const users: AdminUser[] = (profiles ?? []).map((p) => {
      const createdAt = (p.created_at as string | null) ?? null;
      let trialDaysLeft = 15;
      if (createdAt) {
        const end = new Date(createdAt).getTime() + 15 * 24 * 60 * 60 * 1000;
        trialDaysLeft = Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
      }
      return {
        id: p.id as string,
        email: p.email as string | null,
        display_name: p.display_name as string | null,
        diabetes_type: p.diabetes_type as AdminUser["diabetes_type"],
        is_active: p.is_active as boolean,
        is_admin: adminSet.has(p.id as string),
        measurements_count: byUser.get(p.id as string)?.count ?? 0,
        last_measurement: byUser.get(p.id as string)?.last ?? null,
        free_access: !!(p.free_access as boolean | null),
        created_at: createdAt,
        trial_days_left: trialDaysLeft,
      };
    });
    return { users };
  });

export const setUserRoleAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.makeAdmin) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: data.userId, role: "admin" },
        { onConflict: "user_id,role" },
      );
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
    }
    return { ok: true };
  });

export const setUserActiveAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    await supabaseAdmin.from("profiles").update({ is_active: data.active }).eq("id", data.userId);
    return { ok: true };
  });

export const setUserFreeAccessAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), freeAccess: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ free_access: data.freeAccess })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const seedRenaldoAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const email = "renaldoadvoga@gmail.com";
    const password = "renaldodiabetes";

    // 1. Tenta achar
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u) => u.email === email);
    let created = false;
    if (!user) {
      const { data: cu, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: "Renaldo" },
      });
      if (error) throw new Error(`Falha ao criar Renaldo: ${error.message}`);
      user = cu.user!;
      created = true;
    }
    if (!user) throw new Error("Usuário Renaldo não disponível");

    // 2. Garante profile com nome
    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: user.id, email, display_name: "Renaldo" },
        { onConflict: "id" },
      );

    return { userId: user.id, created };
  });