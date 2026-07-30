import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { ShareActions } from "@/components/ShareActions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMeasurements } from "@/lib/glucose.functions";
import { useSession } from "@/hooks/use-session";
import {
  avgByContext,
  filterByRange,
  parseDateTime,
  summarize,
  withValor,
} from "@/lib/glucose-utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (s: Record<string, unknown>) => ({
    u: typeof s.u === "string" ? s.u : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dashboard — Diário de Glicose" },
      {
        name: "description",
        content:
          "Médias diárias, mensais e anuais de glicose com gráficos e indicadores de faixa.",
      },
    ],
  }),
  component: DashboardPage,
});

type Periodo = "diario" | "mensal" | "anual";

const PIE_COLORS = ["#008080", "#7FFFD4", "#5AC8B5", "#0EA5A4", "#94E5D8"];

function DashboardPage() {
  const list = useServerFn(listMeasurements);
  const { hasSession } = useSession();
  const { u } = Route.useSearch();
  const q = useQuery({
    queryKey: ["measurements", u ?? "me"],
    queryFn: () => list({ data: u ? { targetUserId: u } : {} }),
    enabled: hasSession,
  });
  const [periodo, setPeriodo] = useState<Periodo>("diario");

  const itens = q.data?.items ?? [];

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    if (periodo === "diario") from.setHours(0, 0, 0, 0);
    else if (periodo === "mensal") from.setDate(to.getDate() - 30);
    else from.setFullYear(to.getFullYear() - 1);
    if (periodo !== "diario") from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from, to };
  }, [periodo]);

  const filtrados = useMemo(
    () => filterByRange(itens, range.from, range.to),
    [itens, range],
  );

  const stats = summarize(filtrados);

  const lineData = useMemo(() => {
    return withValor(filtrados)
      .sort(
        (a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime(),
      )
      .map((m) => ({
        when: parseDateTime(m).getTime(),
        label:
          periodo === "diario"
            ? m.hora
            : m.data.split("-").reverse().slice(0, 2).join("/"),
        valor: m.valor,
      }));
  }, [filtrados, periodo]);

  const pieData = useMemo(() => avgByContext(filtrados), [filtrados]);

  const barData = useMemo(() => {
    const sorted = withValor(filtrados).sort(
      (a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime(),
    );
    const last = sorted.slice(-12);
    return last.map((m) => ({
      label:
        periodo === "diario"
          ? m.hora
          : m.data.split("-").reverse().slice(0, 2).join("/"),
      valor: m.valor,
    }));
  }, [filtrados, periodo]);

  const barColor = (v: number) => {
    if (v < 70) return "#f59e0b";
    if (v <= 140) return "#10b981";
    if (v <= 180) return "#fb923c";
    return "#ef4444";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Acompanhe suas métricas no período selecionado</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={periodo}
          onValueChange={(v) => setPeriodo(v as Periodo)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3 bg-secondary/70 sm:w-auto sm:inline-flex">
            <TabsTrigger value="diario">Diário</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="anual">Anual</TabsTrigger>
          </TabsList>
        </Tabs>
        <ShareActions
          items={filtrados}
          from={range.from}
          to={range.to}
        />
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Média" value={stats.avg} unit="mg/dL" highlight />
            <StatCard label="Mínima" value={stats.min} unit="mg/dL" />
            <StatCard label="Máxima" value={stats.max} unit="mg/dL" />
            <StatCard label="Medições" value={stats.count} unit="" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Evolução ({periodo})
              </CardTitle>
              <CardDescription>
                Faixa normal destacada em verde
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lineData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sem dados no período.
                </p>
              ) : (
                <div className="h-64 w-full sm:h-80 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={lineData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbece4" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[40, "dataMax + 20"]}
                        tick={{ fontSize: 11 }}
                      />
                      <ReferenceArea
                        y1={70}
                        y2={140}
                        fill="#7FFFD4"
                        fillOpacity={0.25}
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v} mg/dL`, "Glicose"]}
                        labelFormatter={(l) => `Hora: ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="valor"
                        stroke="#008080"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#008080" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Medições recentes (barras)
              </CardTitle>
              <CardDescription>
                Cores conforme faixa: normal, elevada, alta, baixa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sem dados no período.
                </p>
              ) : (
                <div className="h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbece4" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, "dataMax + 20"]}
                        tick={{ fontSize: 11 }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={140}
                        stroke="#fb923c"
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={180}
                        stroke="#ef4444"
                        strokeDasharray="3 3"
                      />
                      <Tooltip
                        formatter={(v: number) => [`${v} mg/dL`, "Glicose"]}
                      />
                      <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                        {barData.map((d, i) => (
                          <Cell key={i} fill={barColor(d.valor)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Médias por contexto</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sem dados.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="count"
                          nameKey="label"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number, _n, p) => [
                            `${v} medição(ões)`,
                            p?.payload?.label,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2 self-center text-sm">
                    {pieData.map((c, i) => (
                      <li
                        key={c.contexto}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm"
                            style={{
                              background: PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          {c.label}
                        </span>
                        <span className="font-medium text-accent">
                          {c.avg} mg/dL
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        highlight
          ? "border-transparent bg-gradient-accent text-accent-foreground shadow-card"
          : "border-border/60 shadow-soft"
      }
    >
      <CardContent className={highlight ? "p-5" : "p-4"}>
        <p
          className={
            highlight
              ? "text-xs font-medium uppercase tracking-wider text-accent-foreground/85"
              : "text-xs font-medium uppercase tracking-wider text-muted-foreground"
          }
        >
          {label}
        </p>
        <p className={highlight ? "font-display mt-2 text-4xl font-semibold" : "font-display mt-1 text-2xl font-semibold"}>
          {value}
          {unit && (
            <span
              className={
                highlight
                  ? "ml-1 text-sm font-normal text-accent-foreground/80"
                  : "ml-1 text-xs font-normal text-muted-foreground"
              }
            >
              {unit}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}