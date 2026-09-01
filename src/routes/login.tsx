import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiabetesTypeSlider, type DiabetesType } from "@/components/DiabetesTypeSlider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import gllicoLogo from "@/assets/gllico-logo.png";
import { MeshGradient } from "@/components/ui/mesh-gradient";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : "/registrar",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: search.redirect || "/registrar" });
    }
  },
  head: () => ({
    meta: [{ title: "Entrar — Gllico" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<DiabetesType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/registrar`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error("Falha ao entrar com Google", { description: (err as Error).message });
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
        navigate({ to: search.redirect || "/registrar" });
      } else {
        if (!name) throw new Error("Informe seu nome");
        if (!type) throw new Error("Selecione tipo 1 ou tipo 2");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success("Cadastro feito! Verifique seu email se a confirmação estiver ativada.");
        // Try sign in (case auto-confirm enabled)
        const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (!e2) {
          // Persist diabetes_type on profile (created by trigger)
          await supabase.from("profiles").update({
            display_name: name,
            diabetes_type: type,
          }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
          navigate({ to: search.redirect || "/registrar" });
        }
      }
    } catch (err) {
      toast.error("Falha", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[88vh] items-center justify-center px-4">
      <MeshGradient className="opacity-70" />
      <Card className="w-full max-w-md border-border/60 shadow-card backdrop-blur-sm">
        <CardHeader className="text-center">
          <Link to="/" className="block w-fit mx-auto">
            <img src={gllicoLogo} alt="Gllico" className="h-24 w-auto transition-opacity hover:opacity-80" />
          </Link>
          <CardTitle className="font-display mt-3 text-3xl">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </CardTitle>
          <CardDescription>Diário de glicose</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label>Tipo de diabetes</Label>
                  <DiabetesTypeSlider value={type} onChange={setType} className="mt-1" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border/60"></div>
              <span className="flex-shrink mx-3 text-xs text-muted-foreground uppercase">ou</span>
              <div className="flex-grow border-t border-border/60"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="h-11 w-full border-border/60 hover:bg-muted"
            >
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Continuar com Google
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="block w-full text-center text-sm text-muted-foreground hover:text-accent pt-1"
            >
              {mode === "login"
                ? "Não tem conta? Criar agora"
                : "Já tem conta? Entrar"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}