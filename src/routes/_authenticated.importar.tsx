import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importFromSheets, importMeasurementRows } from "@/lib/import-sheets.functions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/importar")({
  head: () => ({ meta: [{ title: "Importar do Google Sheets — Gllico" }] }),
  component: ImportPage,
});

function normalizeDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  // dd/mm/yyyy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function normalizeTime(v: unknown): string | null {
  if (v == null || v === "") return "00:00";
  if (v instanceof Date) {
    const h = String(v.getHours()).padStart(2, "0");
    const m = String(v.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return null;
}

type ParsedRow = {
  data: string;
  hora: string;
  valor: number;
  contexto?: string;
  insulina?: number | null;
  refeicao?: string | null;
  observacoes?: string | null;
};

function parseXlsx(buf: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    header: ["data", "hora", "valor", "contexto", "insulina", "refeicao", "observacoes"],
    range: 1,
    raw: true,
    defval: null,
  });
  const out: ParsedRow[] = [];
  for (const r of rows) {
    const data = normalizeDate(r.data);
    const hora = normalizeTime(r.hora);
    const valor = Number(r.valor);
    if (!data || !hora || !Number.isFinite(valor) || valor < 20 || valor > 600) continue;
    out.push({
      data,
      hora,
      valor,
      contexto: r.contexto ? String(r.contexto) : undefined,
      insulina:
        r.insulina == null || r.insulina === ""
          ? null
          : Number.isFinite(Number(r.insulina))
          ? Number(r.insulina)
          : null,
      refeicao: r.refeicao ? String(r.refeicao).slice(0, 200) : null,
      observacoes: r.observacoes ? String(r.observacoes).slice(0, 500) : null,
    });
  }
  return out;
}

function ImportPage() {
  const qc = useQueryClient();
  const run = useServerFn(importFromSheets);
  const runRows = useServerFn(importMeasurementRows);
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);

  const m = useMutation({
    mutationFn: () => run({ data: {} }),
    onSuccess: (r) => {
      toast.success(`Importadas ${r.inserted} de ${r.total} medições`);
      qc.invalidateQueries({ queryKey: ["measurements"] });
    },
    onError: (e: Error) => toast.error("Falhou", { description: e.message }),
  });

  const fileM = useMutation({
    mutationFn: async (file: File) => {
      setParsing(true);
      try {
        const buf = await file.arrayBuffer();
        const rows = parseXlsx(buf);
        if (rows.length === 0) throw new Error("Nenhuma linha válida no arquivo");
        return await runRows({ data: { rows } });
      } finally {
        setParsing(false);
      }
    },
    onSuccess: (r) => {
      toast.success(`Importadas ${r.inserted} de ${r.total} medições`);
      qc.invalidateQueries({ queryKey: ["measurements"] });
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e: Error) => toast.error("Falhou", { description: e.message }),
  });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar arquivo .xlsx</CardTitle>
          <CardDescription>
            Envie o arquivo baixado da planilha. Colunas esperadas (linha 1 é cabeçalho):
            Data, Hora, Valor, Contexto, Insulina, Refeição, Observações. Linhas
            já importadas (mesma data + hora + valor) são puladas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            disabled={fileM.isPending || parsing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) fileM.mutate(f);
            }}
            className="block w-full text-sm file:mr-4 file:h-10 file:rounded-md file:border-0 file:bg-accent file:px-4 file:text-sm file:font-medium file:text-accent-foreground hover:file:bg-accent/90"
          />
          {(fileM.isPending || parsing) && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processando…
            </p>
          )}
          {fileM.data && (
            <p className="text-sm text-muted-foreground">
              <Upload className="mr-1 inline h-3 w-3" />
              Última execução: {fileM.data.inserted}/{fileM.data.total} inseridas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar do Google Sheets</CardTitle>
          <CardDescription>
            Alternativa: puxa direto da planilha online. Já com proteção contra duplicar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => m.mutate()}
            disabled={m.isPending}
            variant="outline"
            className="h-12 w-full"
          >
            {m.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Importar do Google Sheets
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}