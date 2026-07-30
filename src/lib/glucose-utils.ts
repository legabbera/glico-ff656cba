import type { Contexto, Measurement } from "./glucose.functions";

export const CONTEXT_LABEL: Record<Contexto, string> = {
  jejum: "Jejum",
  "pre-refeicao": "Pré-refeição",
  "pos-refeicao": "Pós-refeição",
  "antes-dormir": "Antes de dormir",
  aleatorio: "Aleatório",
};

export function contextLabel(c: Contexto | null | undefined): string {
  return c ? CONTEXT_LABEL[c] : "—";
}

export function classifyGlucose(v: number): {
  label: string;
  tone: "low" | "ok" | "high" | "veryhigh" | "none";
} {
  if (v < 70) return { label: "Hipoglicemia", tone: "low" };
  if (v <= 140) return { label: "Normal", tone: "ok" };
  if (v <= 180) return { label: "Elevada", tone: "high" };
  return { label: "Alta", tone: "veryhigh" };
}

export function toneClasses(tone: ReturnType<typeof classifyGlucose>["tone"]) {
  switch (tone) {
    case "low":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "ok":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "high":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "veryhigh":
      return "bg-red-100 text-red-900 border-red-200";
    case "none":
      return "bg-muted text-muted-foreground border-border";
  }
}

export function parseDateTime(m: Measurement): Date {
  // data esperado YYYY-MM-DD, hora HH:MM
  return new Date(`${m.data}T${(m.hora || "00:00").padEnd(5, "0")}:00`);
}

export function filterByRange(
  items: Measurement[],
  from: Date,
  to: Date,
): Measurement[] {
  const f = from.getTime();
  const t = to.getTime();
  return items.filter((m) => {
    const d = parseDateTime(m).getTime();
    return d >= f && d <= t;
  });
}

export function withValor(
  items: Measurement[],
): Array<Measurement & { valor: number; contexto: Contexto }> {
  return items.filter(
    (m): m is Measurement & { valor: number; contexto: Contexto } =>
      !m.semMedicao && typeof m.valor === "number" && m.contexto !== null,
  );
}

export function summarize(items: Measurement[]) {
  const measured = withValor(items);
  if (measured.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0 };
  }
  const vals = measured.map((i) => i.valor);
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    count: measured.length,
    avg: Math.round(sum / vals.length),
    min: Math.min(...vals),
    max: Math.max(...vals),
  };
}

export function avgByContext(items: Measurement[]) {
  const groups = new Map<Contexto, number[]>();
  for (const m of withValor(items)) {
    const arr = groups.get(m.contexto) ?? [];
    arr.push(m.valor);
    groups.set(m.contexto, arr);
  }
  return Array.from(groups.entries()).map(([k, vs]) => ({
    contexto: k,
    label: CONTEXT_LABEL[k],
    avg: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length),
    count: vs.length,
  }));
}

export function formatBR(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

export function buildWhatsAppReport(
  items: Measurement[],
  from: Date,
  to: Date,
  periodLabel?: string,
): string {
  const s = summarize(items);
  const lines: string[] = [];
  lines.push(`📊 Relatório de Glicose`);
  lines.push(periodLabel ?? `Período: ${formatBR(from)} a ${formatBR(to)}`);
  lines.push(`Medições: ${s.count}`);
  if (s.count > 0) {
    lines.push(`Média: ${s.avg} mg/dL`);
    lines.push(`Mínima: ${s.min} | Máxima: ${s.max}`);
    const ctx = avgByContext(items);
    if (ctx.length) {
      lines.push("");
      lines.push("Por contexto:");
      for (const c of ctx) {
        lines.push(`• ${c.label}: ${c.avg} mg/dL (${c.count})`);
      }
    }
  }
  return lines.join("\n");
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}