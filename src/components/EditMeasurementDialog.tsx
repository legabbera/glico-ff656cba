import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  updateMeasurement,
  MeasurementSchema,
  type Measurement,
  type Contexto,
} from "@/lib/glucose.functions";
import { CONTEXT_LABEL } from "@/lib/glucose-utils";

const CONTEXTOS: Contexto[] = [
  "jejum",
  "pre-refeicao",
  "pos-refeicao",
  "antes-dormir",
  "aleatorio",
];

export function EditMeasurementDialog({
  measurement,
  open,
  onOpenChange,
}: {
  measurement: Measurement | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const update = useServerFn(updateMeasurement);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hora, setHora] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [contexto, setContexto] = useState<Contexto>("jejum");
  const [insulina, setInsulina] = useState<string>("");
  const [refeicao, setRefeicao] = useState<string>("");
  const [observacoes, setObservacoes] = useState<string>("");
  const [semMedicao, setSemMedicao] = useState(false);

  useEffect(() => {
    if (!measurement) return;
    try {
      setDate(parse(measurement.data, "yyyy-MM-dd", new Date()));
    } catch {
      setDate(new Date());
    }
    setHora(measurement.hora ?? "");
    setValor(measurement.valor != null ? String(measurement.valor) : "");
    setContexto((measurement.contexto ?? "jejum") as Contexto);
    setInsulina(measurement.insulina != null ? String(measurement.insulina) : "");
    setRefeicao(measurement.refeicao ?? "");
    setObservacoes(measurement.observacoes ?? "");
    setSemMedicao(measurement.semMedicao);
  }, [measurement]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!measurement?.id) throw new Error("ID inválido");
      if (!date) throw new Error("Data não selecionada");
      const patch = MeasurementSchema.parse({
        data: format(date, "yyyy-MM-dd"),
        hora: hora || null,
        valor: semMedicao ? null : Number(valor),
        contexto: semMedicao ? null : contexto,
        insulina: insulina ? Number(insulina) : null,
        refeicao: refeicao || null,
        observacoes: observacoes || null,
        semMedicao,
      });
      return update({ data: { id: measurement.id, patch } });
    },
    onSuccess: () => {
      toast.success("Medição atualizada!");
      qc.invalidateQueries({ queryKey: ["measurements"] });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Editar medição</DialogTitle>
          <DialogDescription>Corrija os dados e salve.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!semMedicao && !valor) {
              toast.error("Informe o valor da glicose");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
            <div>
              <Label htmlFor="edit-sem" className="text-sm">
                Dia sem medição
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca a linha com traços
              </p>
            </div>
            <Switch id="edit-sem" checked={semMedicao} onCheckedChange={setSemMedicao} />
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="edit-hora" className="text-sm">Hora</Label>
              <Input
                id="edit-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {!semMedicao && (
            <>
              <div>
                <Label htmlFor="edit-valor" className="text-sm">Glicose (mg/dL)</Label>
                <Input
                  id="edit-valor"
                  type="number"
                  inputMode="numeric"
                  min={20}
                  max={600}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Contexto</Label>
                <Select value={contexto} onValueChange={(v) => setContexto(v as Contexto)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTEXTOS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CONTEXT_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-ins" className="text-sm">Insulina (UI)</Label>
                  <Input
                    id="edit-ins"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={200}
                    step="0.5"
                    value={insulina}
                    onChange={(e) => setInsulina(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-ref" className="text-sm">Refeição</Label>
                  <Input
                    id="edit-ref"
                    value={refeicao}
                    maxLength={120}
                    onChange={(e) => setRefeicao(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-obs" className="text-sm">Observações</Label>
                <Textarea
                  id="edit-obs"
                  maxLength={500}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}