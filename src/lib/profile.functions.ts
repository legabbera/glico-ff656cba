import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1).max(120).nullable().optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  diabetes_type: z.enum(["tipo1", "tipo2"]).nullable().optional(),
  glucose_min: z.number().int().min(40).max(200).optional(),
  glucose_max: z.number().int().min(80).max(400).optional(),
  foods_better: z.string().max(2000).nullable().optional(),
  foods_worse: z.string().max(2000).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  bairro: z.string().max(100).nullable().optional(),
  municipio: z.string().max(100).nullable().optional(),
  uf: z.string().length(2).nullable().optional(),
});

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  birth_date: string | null;
  diabetes_type: "tipo1" | "tipo2" | null;
  glucose_min: number;
  glucose_max: number;
  foods_better: string | null;
  foods_worse: string | null;
  is_active: boolean;
  free_access?: boolean;
  avatar_url?: string | null;
  created_at?: string;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
};

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, userEmail } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    let profile = data as Profile | null;
    if (!profile) {
      const { data: ins, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: userId, email: userEmail, display_name: userEmail?.split("@")[0] ?? null })
        .select("*")
        .single();
      if (insErr) throw new Error(insErr.message);
      profile = ins as Profile;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    return { profile, isAdmin };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });