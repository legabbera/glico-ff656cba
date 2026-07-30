import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ShareActions } from "@/components/ShareActions";
import { EditMeasurementDialog } from "@/components/EditMeasurementDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMeasurement,
  listMeasurements,
  type Measurement,
} from "@/lib/glucose.functions";
import { useSession } from "@/hooks/use-session";
import {
  classifyGlucose,
  CONTEXT_LABEL,
  filterByRange,
  toneClasses,
} from "@/lib/glucose-utils";
import { cn } from "@/lib/utils";
import { formatBR } from "@/lib/glucose-utils";

export const Route = createFileRoute("/_authenticated/historico")({
  validateSearch: (s: Record<string, unknown>) => ({
    u: typeof s.u === "string" ? s.u : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Histórico — Diário de Glicose" },
      {
        name: "description",
        content:
          "Veja todas as medições registradas, filtre por período e compartilhe relatórios pelo WhatsApp.",
      },
    ],
  }),
  component: HistoricoPage,
});

type Filtro = "tudo" | "7" | "30" | "90";
type PeriodMode = "rapido" | "mes" | "intervalo";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function HistoricoPage() {
  const list = useServerFn(listMeasurements);
  const del = useServerFn(deleteMeasurement);
  const qc = useQueryClient();
  const { hasSession } = useSession();
  const { u } = Route.useSearch();
  const q = useQuery({
    queryKey: ["measurements", u ?? "me"],
    queryFn: () => list({ data: u ? { targetUserId: u } : {} }),
    enabled: hasSession,
  });
  const [filtro, setFiltro] = useState<Filtro>("30");
  const [ctx, setCtx] = useState<string>("todos");
  const [mode, setMode] = useState<PeriodMode>("rapido");
  const now = new Date();
  const [mes, setMes] = useState<number>(now.getMonth());
  const [ano, setAno] = useState<number>(now.getFullYear());
  const [dataDe, setDataDe] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [dataAte, setDataAte] = useState<Date | undefined>(new Date());
  const [includeCharts, setIncludeCharts] = useState(true);
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [deleting, setDeleting] = useState<Measurement | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Medição apagada.");
      qc.invalidateQueries({ queryKey: ["measurements"] });
      setDeleting(null);
    },
    onError: (e: Error) =>
      toast.error("Não foi possível apagar", { description: e.message }),
  });

  const itens = q.data?.items ?? [];

  const range = useMemo(() => {
    if (mode === "mes") {
      const from = new Date(ano, mes, 1, 0, 0, 0, 0);
      const to = new Date(ano, mes + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
    if (mode === "intervalo") {
      const from = new Date(dataDe ?? new Date());
      const to = new Date(dataAte ?? new Date());
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    const to = new Date();
    const from = new Date();
    if (filtro === "tudo") from.setFullYear(2000);
    else from.setDate(to.getDate() - Number(filtro));
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [filtro, mode, mes, ano, dataDe, dataAte]);

  const periodLabel = useMemo(() => {
    if (mode === "mes") return `Mês: ${MESES[mes]}/${ano}`;
    return `Período: ${formatBR(range.from)} a ${formatBR(range.to)}`;
  }, [mode, mes, ano, range]);

  const filtrados = useMemo(() => {
    const base = filterByRange(itens, range.from, range.to);
    return ctx === "todos"
      ? base
      : base.filter((m) => m.semMedicao || m.contexto === ctx);
  }, [itens, range, ctx]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Histórico</h1>
        <p className="text-sm text-muted-foreground">Filtre, revise e compartilhe suas medições</p>
      </div>
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="font-display text-lg">Filtros</CardTitle>
          <CardDescription>
            {filtrados.length} medição(ões) no filtro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as PeriodMode)}>
            <TabsList>
              <TabsTrigger value="rapido">Rápido</TabsTrigger>
              <TabsTrigger value="mes">Mês</TabsTrigger>
              <TabsTrigger value="intervalo">Intervalo</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "mes" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }, (_, i) => now.getFullYear() - i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "intervalo" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start sm:w-[180px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataDe ? formatBR(dataDe) : "De"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataDe} onSelect={setDataDe} initialFocus className="pointer-events-auto p-3" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start sm:w-[180px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataAte ? formatBR(dataAte) : "Até"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataAte} onSelect={setDataAte} initialFocus className="pointer-events-auto p-3" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:contents">
              {mode === "rapido" && (
              <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="tudo">Tudo</SelectItem>
                </SelectContent>
              </Select>
              )}
              <Select value={ctx} onValueChange={setCtx}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os contextos</SelectItem>
                  {Object.entries(CONTEXT_LABEL).map(([k, l]) => (
                    <SelectItem key={k} value={k}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeCharts}
                  onCheckedChange={(v) => setIncludeCharts(!!v)}
                />
                <span>Incluir gráficos no PDF</span>
              </label>
              <ShareActions
                items={filtrados}
                from={range.from}
                to={range.to}
                includeCharts={includeCharts}
                periodLabel={periodLabel}
              />
            </div>
          </div>

          {q.isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma medição neste período.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtrados.map((m, i) => {
                const sem = m.semMedicao || m.valor == null;
                const c = sem
                  ? { label: "Sem medição", tone: "none" as const }
                  : classifyGlucose(m.valor as number);
                return (
                  <li key={m.id ?? `${m.criadoEm}-${i}`} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-accent">
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
                          {m.insulina ? ` • ${m.insulina} UI` : ""}
                        </p>
                        {(m.refeicao || m.observacoes) && (
                          <p className="mt-1 text-xs text-foreground/80 line-clamp-2">
                            {[m.refeicao, m.observacoes].filter(Boolean).join(" — ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-xs font-medium",
                            toneClasses(c.tone),
                          )}
                        >
                          {c.label}
                        </span>
                        {m.id && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="Editar medição"
                              onClick={() => setEditing(m)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label="Apagar medição"
                              onClick={() => setDeleting(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <EditMeasurementDialog
        measurement={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar medição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting?.id) deleteMutation.mutate(deleting.id);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}