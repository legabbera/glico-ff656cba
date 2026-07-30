import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { getAccessStatus, PLAN_PRICE_BRL, TRIAL_DAYS } from "@/lib/access.functions";
import { createMercadoPagoPreference } from "@/lib/mercado-pago.functions";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — Gllico" },
      { name: "description", content: `Comece grátis por ${TRIAL_DAYS} dias. Depois apenas R$ ${PLAN_PRICE_BRL.toFixed(2).replace(".", ",")}/mês.` },
      { property: "og:title", content: "Planos — Gllico" },
      { property: "og:description", content: `Diário de glicose com ${TRIAL_DAYS} dias grátis, depois R$ ${PLAN_PRICE_BRL.toFixed(2).replace(".", ",")}/mês.` },
    ],
  }),
  component: PlanosPage,
});

function PlanosPage() {
  const { hasSession } = useSession();
  const getAccess = useServerFn(getAccessStatus);
  const createPayment = useServerFn(createMercadoPagoPreference);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const accessQ = useQuery({
    queryKey: ["access-status"],
    queryFn: () => getAccess(),
    enabled: hasSession,
  });

  const handleAssinar = async () => {
    if (!hasSession) return;
    try {
      setIsRedirecting(true);
      const res = await createPayment();
      if (res.initPoint) {
        window.location.href = res.initPoint;
      }
    } catch (err) {
      toast.error("Erro ao iniciar pagamento", { description: (err as Error).message });
      setIsRedirecting(false);
    }
  };

  const preco = PLAN_PRICE_BRL.toFixed(2).replace(".", ",");

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <header className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">Planos e preços</p>
        <h1 className="font-display mt-2 text-3xl sm:text-4xl">Comece grátis. Continue por pouco.</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          {TRIAL_DAYS} dias grátis para testar tudo. Depois, uma assinatura simples de R$ {preco} por mês.
        </p>
        {accessQ.data && (
          <p className="mt-4 text-sm text-accent">
            {accessQ.data.reason === "trial"
              ? `Seu período grátis termina em ${accessQ.data.trialDaysLeft} dia(s).`
              : accessQ.data.reason === "free_access"
                ? "Você tem acesso gratuito liberado pelo administrador."
                : accessQ.data.reason === "admin"
                  ? "Você é administrador — acesso liberado."
                  : "Seu período grátis terminou. Assine para continuar."}
          </p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-xl">Teste grátis</CardTitle>
            <CardDescription>Sem cartão de crédito.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-display text-4xl">
              {TRIAL_DAYS} <span className="text-lg font-normal text-muted-foreground">dias</span>
            </p>
            <ul className="space-y-2 text-sm">
              <Feat>Registro ilimitado de medições</Feat>
              <Feat>Dashboard com gráficos</Feat>
              <Feat>Relatório PDF e WhatsApp</Feat>
              <Feat>Importação de planilha</Feat>
            </ul>
            {hasSession ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/registrar">Ir para o app</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Criar conta grátis</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-gradient-accent text-accent-foreground shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="font-display text-xl">Mensal</CardTitle>
            </div>
            <CardDescription className="text-accent-foreground/85">
              Acesso completo, cobrança recorrente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-display text-4xl">
              R$ {preco}
              <span className="text-lg font-normal text-accent-foreground/85"> /mês</span>
            </p>
            <ul className="space-y-2 text-sm">
              <Feat light>Tudo do teste grátis</Feat>
              <Feat light>Histórico completo sem limite</Feat>
              <Feat light>Suporte por WhatsApp</Feat>
              <Feat light>Cancele quando quiser</Feat>
            </ul>
            {hasSession ? (
              <Button
                onClick={handleAssinar}
                disabled={isRedirecting}
                className="w-full bg-background text-foreground hover:bg-background/90"
              >
                {isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assinar por R$ {preco}/mês
              </Button>
            ) : (
              <Button asChild className="w-full bg-background text-foreground hover:bg-background/90">
                <Link to="/login">Entrar para assinar</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feat({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check className={light ? "mt-0.5 h-4 w-4 shrink-0" : "mt-0.5 h-4 w-4 shrink-0 text-accent"} />
      <span>{children}</span>
    </li>
  );
}