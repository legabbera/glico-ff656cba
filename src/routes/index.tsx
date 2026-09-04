import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileDown,
  Lock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import gllicoLogo from "@/assets/gllico-logo.png";
import { MeshGradient } from "@/components/ui/mesh-gradient";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gllico — Diário de glicemia clínico e simples" },
      {
        name: "description",
        content:
          "Registre sua glicose em segundos, veja tendências e gere relatórios em PDF para seu médico. Seguro, sem instalar nada.",
      },
      { property: "og:title", content: "Gllico — Diário de glicemia" },
      {
        property: "og:description",
        content:
          "Diário digital de glicemia com gráficos limpos, relatórios PDF e compartilhamento por WhatsApp.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLogged(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsLogged(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={gllicoLogo} alt="Gllico" className="h-8 w-auto sm:h-9" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#recursos" className="transition hover:text-foreground">
              Recursos
            </a>
            <a href="#como-funciona" className="transition hover:text-foreground">
              Como funciona
            </a>
            <a href="#seguranca" className="transition hover:text-foreground">
              Segurança
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isLogged ? (
              <Link to="/dashboard">
                <Button
                  size="sm"
                  className="rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/90"
                >
                  Acessar Painel
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
                >
                  Entrar
                </Link>
                <Link to="/login">
                  <Button
                    size="sm"
                    className="rounded-full bg-accent px-4 text-accent-foreground hover:bg-accent/90"
                  >
                    Começar grátis
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Camada de Fundo Premium */}
        <MeshGradient />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Novo · Relatório em PDF automático
            </span>
            <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl uppercase">
              Sua glicose,{" "}
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                organizada
              </span>{" "}
              e sob controle.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Registre em segundos, visualize tendências claras e leve um relatório completo para o
              médico — sem planilha, sem caderno, sem esforço.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to={isLogged ? "/registrar" : "/login"}>
                <Button
                  size="lg"
                  className="h-12 w-full rounded-full bg-accent px-6 text-base text-accent-foreground shadow-soft hover:bg-accent/90 sm:w-auto"
                >
                  {isLogged ? "Registrar medição" : "Criar meu diário"}{" "}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              {!isLogged && (
                <p className="text-sm text-muted-foreground">Grátis · sem cartão de crédito</p>
              )}
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-6">
              {["Sem instalar", "Dados criptografados", "Acesso em qualquer aparelho"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-accent opacity-20 blur-3xl"
            />
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Painel de hoje
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold">Quarta-feira</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  no alvo
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "Última", value: "112", unit: "mg/dL", tone: "accent" },
                  { label: "Média 7d", value: "118", unit: "mg/dL", tone: "foreground" },
                  { label: "No alvo", value: "82", unit: "%", tone: "foreground" },
                ].map((k) => (
                  <div key={k.label} className="rounded-2xl bg-muted/50 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {k.label}
                    </p>
                    <p
                      className={`mt-1 font-display text-2xl font-bold tracking-tight ${
                        k.tone === "accent" ? "text-accent" : "text-foreground"
                      }`}
                    >
                      {k.value}
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                        {k.unit}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Tendência · 14 dias</span>
                  <span className="inline-flex items-center gap-1 font-medium text-accent">
                    <TrendingUp className="h-3.5 w-3.5" /> -6%
                  </span>
                </div>
                <svg viewBox="0 0 300 90" className="h-24 w-full">
                  <defs>
                    <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="text-accent">
                    <path
                      d="M0,60 L25,55 L50,58 L75,42 L100,48 L125,32 L150,38 L175,28 L200,34 L225,20 L250,26 L275,14 L300,20 L300,90 L0,90 Z"
                      fill="url(#fill)"
                    />
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points="0,60 25,55 50,58 75,42 100,48 125,32 150,38 175,28 200,34 225,20 250,26 275,14 300,20"
                    />
                  </g>
                </svg>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  <span className="text-muted-foreground">Próxima medição sugerida</span>
                </div>
                <span className="font-medium">antes do almoço</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Recursos
            </p>
            <h2 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
              Feito para o cuidado do dia a dia
            </h2>
            <p className="mt-3 text-muted-foreground">
              Todas as ferramentas que você precisa em um só lugar. Simples para começar, completo
              para acompanhar sua evolução.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Activity,
                title: "Registro em segundos",
                desc: "Digite o valor, escolha o contexto e pronto. Salva na hora, funciona no celular e no computador.",
              },
              {
                icon: BarChart3,
                title: "Gráficos claros",
                desc: "Tendências de 7, 14 e 30 dias em traços limpos. Veja o que está funcionando no seu tratamento.",
              },
              {
                icon: FileDown,
                title: "Relatório PDF pronto",
                desc: "Um clique gera um PDF A4 formatado com médias por contexto, ideal para levar à consulta.",
              },
              {
                icon: MessageCircle,
                title: "Compartilhar no WhatsApp",
                desc: "Envie o resumo do período para família ou equipe médica em uma única mensagem.",
              },
              {
                icon: ShieldCheck,
                title: "Dias sem medição",
                desc: "Marque dias sem medir para manter o histórico honesto — sem quebrar a linha do tempo.",
              },
              {
                icon: Lock,
                title: "Dados protegidos",
                desc: "Criptografia em trânsito e em repouso. Só você e quem você autorizar acessa seu histórico.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Como funciona
          </p>
          <h2 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
            3 passos e você já tem seu diário
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Crie sua conta",
              desc: "Email e senha. Menos de um minuto. Grátis.",
            },
            {
              n: "02",
              title: "Registre a medição",
              desc: "Valor, contexto e horário. O app faz o resto.",
            },
            {
              n: "03",
              title: "Acompanhe e compartilhe",
              desc: "Gráficos, PDF e envio pelo WhatsApp.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
            >
              <span className="font-display text-5xl font-bold tracking-tight text-accent/25">
                {s.n}
              </span>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY */}
      <section id="seguranca" className="border-t border-border/50 bg-gradient-warm">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Segurança
            </p>
            <h2 className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
              Seus dados de saúde ficam com você
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Tudo é armazenado em infraestrutura em nuvem com criptografia, controle de acesso por
              usuário e conformidade com a LGPD. O Gllico é um diário — não substitui o
              acompanhamento médico.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Criptografia em trânsito (TLS) e em repouso",
              "Isolamento por conta com Row-Level Security",
              "Backup automático da sua base de medições",
              "Você pode exportar ou apagar seus dados quando quiser",
            ].map((s) => (
              <li
                key={s}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/70 p-4 text-sm backdrop-blur"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-accent p-10 text-center shadow-card sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold uppercase text-primary-foreground sm:text-5xl">
              Comece hoje mesmo o seu diário
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/85">
              Um hábito de dez segundos que transforma sua próxima consulta.
            </p>
            <Link to={isLogged ? "/dashboard" : "/login"} className="mt-8 inline-block">
              <Button
                size="lg"
                className="h-12 rounded-full bg-background px-8 text-base text-foreground shadow-soft hover:bg-background/90"
              >
                {isLogged ? "Acessar meu diário" : "Criar meu diário grátis"}{" "}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <img src={gllicoLogo} alt="Gllico" className="h-6 w-auto" />
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Gllico · Diário de glicemia
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a
              href="https://www.instagram.com/gllicoofc/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Instagram
            </a>
            <Link to="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <a href="#seguranca" className="hover:text-foreground">
              Segurança
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
