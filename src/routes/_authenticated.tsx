import { createFileRoute, Outlet, redirect, useRouterState, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAccessStatus } from "@/lib/access.functions";
import { useSession } from "@/hooks/use-session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthedShell,
});

const ALWAYS_ALLOWED = ["/admin", "/perfil", "/assinatura"];

function AuthedShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hasSession } = useSession();
  const getAccess = useServerFn(getAccessStatus);
  const q = useQuery({
    queryKey: ["access-status"],
    queryFn: () => getAccess(),
    enabled: hasSession,
    staleTime: 60_000,
  });

  const allowed = ALWAYS_ALLOWED.some((p) => pathname.startsWith(p));
  if (!allowed && q.data && !q.data.hasAccess) {
    return <ExpiredNotice />;
  }
  return <Outlet />;
}

function ExpiredNotice() {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-accent" />
            <CardTitle className="font-display text-xl">Seu período gratuito terminou</CardTitle>
          </div>
          <CardDescription>
            Assine para continuar registrando suas medições e acompanhando seus gráficos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/planos">Ver planos</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/perfil">Ir para o perfil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}