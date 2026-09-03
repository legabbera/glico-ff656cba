import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart3, ListChecks, LogOut, Moon, Sun, User as UserIcon, ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gllicoLogo from "@/assets/gllico-logo.png";
import { useTheme } from "@/components/ThemeProvider";
import { getMyProfile } from "@/lib/profile.functions";
import { getAccessStatus } from "@/lib/access.functions";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const BASE_NAV = [
  { to: "/registrar", label: "REGISTRAR", icon: Activity, exact: true },
  { to: "/dashboard", label: "DASHBOARD", icon: BarChart3, exact: false },
  { to: "/historico", label: "HISTÓRICO", icon: ListChecks, exact: false },
  { to: "/perfil", label: "PERFIL", icon: UserIcon, exact: false },
  { to: "/suporte", label: "SUPORTE", icon: MessageSquare, exact: false },
] as const;

export function AppHeader() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const { theme, toggle } = useTheme();
  const fetchProfile = useServerFn(getMyProfile);
  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: !!email,
  });
  const isAdmin = !!profileQ.data?.isAdmin;
  const getAccess = useServerFn(getAccessStatus);
  const accessQ = useQuery({
    queryKey: ["access-status"],
    queryFn: () => getAccess(),
    enabled: !!email,
    staleTime: 60_000,
  });
  const access = accessQ.data;

  const firstName = profileQ.data?.profile?.display_name?.split(" ")[0] || "";

  const badge = access
    ? access.reason === "admin"
      ? null
      : access.reason === "free_access"
        ? { text: "Gratuito", tone: "ok" as const }
        : access.reason === "trial"
          ? { text: `Trial · ${access.trialDaysLeft}d`, tone: access.trialDaysLeft <= 3 ? "warn" as const : "info" as const }
          : { text: "Expirado", tone: "danger" as const }
    : null;

  const navItems = isAdmin
    ? [...BASE_NAV, { to: "/admin", label: "ADMIN", icon: ShieldCheck, exact: false } as const]
    : BASE_NAV;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const topLinkBase =
    "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-foreground/70 hover:text-accent hover:bg-secondary/60 transition-colors";
  const topActive = "text-accent-foreground bg-accent shadow-soft";

  const bottomBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-foreground/60 transition-colors";
  const bottomActive = "text-accent";

  return (
    <>
      {/* Top header — visible on tablet/desktop */}
      <header className="sticky top-0 z-30 hidden border-b border-border/60 bg-background/80 backdrop-blur sm:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/registrar" className="flex items-center gap-2">
            <img
              src={gllicoLogo}
              alt="Gllico"
              style={{ width: 130, height: 52.7 }}
            />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Diário do paciente</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {badge && (
              <Link
                to="/planos"
                className={
                  "mr-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium " +
                  (badge.tone === "ok"
                    ? "bg-emerald-100 text-emerald-900"
                    : badge.tone === "warn"
                      ? "bg-amber-100 text-amber-900"
                      : badge.tone === "danger"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-accent/10 text-accent")
                }
                title="Ver planos"
              >
                <Sparkles className="h-3 w-3" /> {badge.text}
              </Link>
            )}
            {navItems.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                activeOptions={it.exact ? { exact: true } : undefined}
                className={topLinkBase}
                activeProps={{ className: `${topLinkBase} ${topActive}` }}
              >
                {it.to === "/perfil" && profileQ.data?.profile?.avatar_url ? (
                  <Avatar className="h-5 w-5 border border-border/50">
                    <AvatarImage src={profileQ.data.profile.avatar_url} className="object-cover" />
                    <AvatarFallback><it.icon className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <it.icon className="h-4 w-4" />
                )}
                <span className="uppercase">{it.to === "/perfil" && firstName ? firstName : it.label}</span>
              </Link>
            ))}
            <button
              onClick={toggle}
              className={`${topLinkBase} ml-1`}
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {email && (
              <button
                onClick={handleLogout}
                className={`${topLinkBase} ml-2`}
                title={email}
              >
                <LogOut className="h-4 w-4" /> <span>SAIR</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Compact mobile top bar — brand only */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur sm:hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img src={gllicoLogo} alt="Gllico" style={{ width: 130, height: 52.7 }} />
            <div className="leading-tight">
              <p className="text-[10px] text-muted-foreground">Diário do paciente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            {badge && (
              <Link
                to="/planos"
                className={
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium " +
                  (badge.tone === "ok"
                    ? "bg-emerald-100 text-emerald-900"
                    : badge.tone === "warn"
                      ? "bg-amber-100 text-amber-900"
                      : badge.tone === "danger"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-accent/10 text-accent")
                }
              >
                {badge.text}
              </Link>
            )}
            <button onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {email && (
              <button onClick={handleLogout} aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {navItems.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={it.exact ? { exact: true } : undefined}
              className={bottomBase}
              activeProps={{ className: `${bottomBase} ${bottomActive}` }}
            >
              {it.to === "/perfil" && profileQ.data?.profile?.avatar_url ? (
                <Avatar className="h-6 w-6 border border-border/50">
                  <AvatarImage src={profileQ.data.profile.avatar_url} className="object-cover" />
                  <AvatarFallback><it.icon className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              ) : (
                <it.icon className="h-5 w-5" />
              )}
              <span className="uppercase">{it.to === "/perfil" && firstName ? firstName : it.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}