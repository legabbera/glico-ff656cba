import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TRIAL_DAYS = 15;
export const PLAN_PRICE_BRL = 4.99;

export type AccessStatus = {
  hasAccess: boolean;
  reason: "trial" | "free_access" | "admin" | "expired" | "subscription";
  trialDaysLeft: number;
  trialEndsAt: string | null;
  freeAccess: boolean;
  isAdmin: boolean;
  subscriptionStatus?: string;
  subscriptionActiveUntil?: string | null;
};

function computeTrial(createdAt: string | null | undefined) {
  if (!createdAt) return { daysLeft: TRIAL_DAYS, endsAt: null as string | null };
  const start = new Date(createdAt).getTime();
  const end = start + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
  return { daysLeft, endsAt: new Date(end).toISOString() };
}

export const getAccessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccessStatus> => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_access, created_at, subscription_status, subscription_active_until")
      .eq("id", userId)
      .maybeSingle();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    const freeAccess = !!profile?.free_access;
    const subscriptionStatus = profile?.subscription_status || "inactive";
    const subscriptionActiveUntil = profile?.subscription_active_until || null;
    const isSubscriptionActive = subscriptionActiveUntil
      ? new Date(subscriptionActiveUntil).getTime() > Date.now()
      : false;
    const { daysLeft, endsAt } = computeTrial(profile?.created_at as string | undefined);

    if (isAdmin) {
      return { hasAccess: true, reason: "admin", trialDaysLeft: daysLeft, trialEndsAt: endsAt, freeAccess, isAdmin, subscriptionStatus, subscriptionActiveUntil };
    }
    if (freeAccess) {
      return { hasAccess: true, reason: "free_access", trialDaysLeft: daysLeft, trialEndsAt: endsAt, freeAccess, isAdmin, subscriptionStatus, subscriptionActiveUntil };
    }
    if (isSubscriptionActive) {
      return { hasAccess: true, reason: "subscription", trialDaysLeft: daysLeft, trialEndsAt: endsAt, freeAccess, isAdmin, subscriptionStatus, subscriptionActiveUntil };
    }
    if (daysLeft > 0) {
      return { hasAccess: true, reason: "trial", trialDaysLeft: daysLeft, trialEndsAt: endsAt, freeAccess, isAdmin, subscriptionStatus, subscriptionActiveUntil };
    }
    return { hasAccess: false, reason: "expired", trialDaysLeft: 0, trialEndsAt: endsAt, freeAccess, isAdmin, subscriptionStatus, subscriptionActiveUntil };
  });