import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, MinusCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  appendMeasurement,
  listMeasurements,
  MeasurementSchema,
} from "@/lib/glucose.functions";
import { useSession } from "@/hooks/use-session";
import {
  classifyGlucose,
  CONTEXT_LABEL,
  toneClasses,
} from "@/lib/glucose-utils";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar medição — Diário de Glicose" },
      {
        name: "description",
        content:
          "Registre suas medições de glicose com data, hora e contexto. Salvas direto na sua planilha do Google Sheets.",
      },
    ],
  }),
  component: RegistrarPage,
});

const CONTEXTOS = [
  "jejum",
  "pre-refeicao",
  "pos-refeicao",
  "antes-dormir",
  "aleatorio",
] as const;

function RegistrarPage() {
  const qc = useQueryClient();
  const append = useServerFn(appendMeasurement);
  const list = useServerFn(listMeasurements);
  const fetchProfile = useServerFn(getMyProfile);
  const { hasSession } = useSession();

  // Avoid SSR/CSR hydration mismatch: hydrate with stable values, then sync on client.
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hora, setHora] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [contexto, setContexto] =
    useState<(typeof CONTEXTOS)[number]>("jejum");
  const [insulina, setInsulina] = useState<string>("");
  const [refeicao, setRefeicao] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");

  // Set today's date and current time on client-side mount.
  useEffect(() => {
    const n = new Date();
    setDate(n);
    setHora(format(n, "HH:mm"));
  }, []);

  const recent = useQuery({
    queryKey: ["measurements", "me"],
    queryFn: () => list({ data: {} }),
    enabled: hasSession,
  });

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: hasSession,
  });

  const firstName = profileQ.data?.profile?.display_name?.split(" ")[0] || "";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error("Data não selecionada");
      const payload = MeasurementSchema.parse({
        data: format(date, "yyyy-MM-dd"),
        hora,
        valor: Number(valor),
        contexto,
        insulina: insulina ? Number(insulina) : null,
        refeicao: refeicao || null,
        observacoes: observacoes || null,
        semMedicao: false,
      });
      return append({ data: payload });
    },
    onSuccess: () => {
      toast.success("Medição registrada!");
      setValor("");
      setInsulina("");
      setRefeicao("");
      setObservacoes("");
      setHora(format(new Date(), "HH:mm"));
      qc.invalidateQueries({ queryKey: ["measurements"] });
    },
    onError: (e: Error) => {
      toast.error("Não foi possível salvar", { description: e.message });
    },
  });

  const semMedicaoMutation = useMutation({
    mutationFn: async () => {
      if (!date) throw new Error("Data não selecionada");
      const payload = MeasurementSchema.parse({
        data: format(date, "yyyy-MM-dd"),
        hora: hora || null,
        valor: null,
        contexto: null,
        insulina: null,
        refeicao: null,
        observacoes: observacoes || null,
        semMedicao: true,
      });
      return append({ data: payload });
    },
    onSuccess: () => {
      toast.success("Dia sem medição registrado.");
      setObservacoes("");
      qc.invalidateQueries({ queryKey: ["measurements"] });
    },
    onError: (e: Error) => {
      toast.error("Não foi possível salvar", { description: e.message });
    },
  });

  const recents = (recent.data?.items ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">
          Bem-vindo{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Registre uma medição em segundos</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border-border/60 shadow-card lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-display text-xl sm:text-2xl">Nova medição</CardTitle>
          <CardDescription>
            Anote sua glicose em segundos. Tudo é salvo na sua planilha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!valor) {
                toast.error("Informe o valor da glicose");
                return;
              }
              mutation.mutate();
            }}
          >
            <div>
              <Label htmlFor="valor" className="text-sm">
                Glicose (mg/dL)
              </Label>
              <Input
                id="valor"
                type="number"
                inputMode="numeric"
                min={20}
                max={600}
                placeholder="sem medição"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1 h-16 text-4xl font-semibold tracking-tight text-accent sm:h-14 sm:text-3xl"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-1 w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="hora" className="text-sm">
                  Hora
                </Label>
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Contexto</Label>
              <RadioGroup
                value={contexto}
                onValueChange={(v) =>
                  setContexto(v as (typeof CONTEXTOS)[number])
                }
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {CONTEXTOS.map((c) => (
                  <div key={c} className="flex items-center space-x-2 rounded-md border p-3 shadow-sm transition-colors hover:bg-accent/5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <RadioGroupItem value={c} id={`contexto-${c}`} />
                    <Label htmlFor={`contexto-${c}`} className="text-sm cursor-pointer w-full font-medium">
                      {CONTEXT_LABEL[c]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="insulina" className="text-sm">
                  Insulina (UI)
                </Label>
                <Input
                  id="insulina"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={200}
                  step="0.5"
                  placeholder="sem medição"
                  value={insulina}
                  onChange={(e) => setInsulina(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="refeicao" className="text-sm">
                  Refeição
                </Label>
                <Input
                  id="refeicao"
                  placeholder="opcional"
                  value={refeicao}
                  maxLength={120}
                  onChange={(e) => setRefeicao(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="obs" className="text-sm">
                Observações
              </Label>
              <Textarea
                id="obs"
                placeholder="opcional"
                maxLength={500}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 w-full bg-accent text-accent-foreground text-base font-semibold shadow-sm hover:bg-accent/90 active:scale-[0.99] transition-transform"
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Registrar medição
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={semMedicaoMutation.isPending || mutation.isPending}
              onClick={() => semMedicaoMutation.mutate()}
              className="h-11 w-full"
            >
              {semMedicaoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MinusCircle className="mr-2 h-4 w-4" />
              )}
              Registrar dia sem medição
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Últimas medições</CardTitle>
              <CardDescription>3 mais recentes</CardDescription>
            </div>
            <Link
              to="/historico"
              className="text-sm font-medium text-accent hover:underline"
            >
              Ver tudo →
            </Link>
          </CardHeader>
          <CardContent>
          {recent.isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : recents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma medição ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {recents.map((m, i) => {
                const sem = m.semMedicao || m.valor == null;
                const c = sem
                  ? { label: "Sem medição", tone: "none" as const }
                  : classifyGlucose(m.valor as number);
                return (
                  <li
                    key={m.id ?? `${m.criadoEm}-${i}`}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-base font-semibold text-accent">
                        {sem ? "— — —" : m.valor}
                        {!sem && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}mg/dL
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {m.data.split("-").reverse().join("/")}
                        {m.hora ? ` • ${m.hora}` : ""}
                        {m.contexto ? ` • ${CONTEXT_LABEL[m.contexto]}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        toneClasses(c.tone),
                      )}
                    >
                      {c.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-warm shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Faixas de referência</CardTitle>
            <CardDescription>Valores em mg/dL</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-border/60 text-sm">
              {[
                { label: "Baixa", range: "< 70", tone: "low" as const },
                { label: "Normal", range: "70 – 140", tone: "ok" as const },
                { label: "Elevada", range: "141 – 180", tone: "high" as const },
                { label: "Alta", range: "> 180", tone: "veryhigh" as const },
              ].map((r) => (
                <li
                  key={r.label}
                  className="flex items-center justify-between py-2"
                >
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      toneClasses(r.tone),
                    )}
                  >
                    {r.label}
                  </span>
                  <span className="font-medium text-foreground">{r.range}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Referência geral. Consulte seu médico para metas individuais.
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}