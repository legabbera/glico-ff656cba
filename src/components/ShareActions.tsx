import { useState } from "react";
import { FileDown, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Measurement } from "@/lib/glucose.functions";
import { buildWhatsAppReport, whatsappLink, formatBR } from "@/lib/glucose-utils";
import { generatePdfReport } from "@/lib/glucose-pdf";

export function ShareActions({
  items,
  from,
  to,
  disabled,
  includeCharts = true,
  periodLabel,
}: {
  items: Measurement[];
  from: Date;
  to: Date;
  disabled?: boolean;
  includeCharts?: boolean;
  periodLabel?: string;
}) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingWhats, setLoadingWhats] = useState(false);

  const handleWhats = async () => {
    const text = buildWhatsAppReport(items, from, to, periodLabel);
    setLoadingWhats(true);
    try {
      const blob = await generatePdfReport(items, from, to, {
        includeCharts,
        periodLabel,
        asBlob: true,
      });

      if (blob) {
        const filename = `gllico-relatorio-${formatBR(from).replaceAll("/", "-")}_${formatBR(to).replaceAll("/", "-")}.pdf`;
        const file = new File([blob], filename, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Relatório de Glicose - Gllico",
            text: text,
            files: [file],
          });
          return; // Sucesso ao abrir a gaveta de compartilhamento
        }
      }
      
      // Fallback: se o navegador/dispositivo não suportar envio de arquivos (ex: PC desktop antigo)
      // Envia apenas o texto via link do WhatsApp Web
      window.open(whatsappLink(text), "_blank");
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error("Erro ao compartilhar", {
          description: (e as Error).message,
        });
        // Tenta fallback do texto se o PDF falhou por algum motivo desconhecido
        window.open(whatsappLink(text), "_blank");
      }
    } finally {
      setLoadingWhats(false);
    }
  };

  const handlePdf = async () => {
    setLoadingPdf(true);
    try {
      await generatePdfReport(items, from, to, { includeCharts, periodLabel });
    } catch (e) {
      toast.error("Não foi possível gerar o PDF", {
        description: (e as Error).message,
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const isDisabled = disabled || items.length === 0;

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button
        onClick={handleWhats}
        disabled={isDisabled || loadingWhats}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
      >
        {loadingWhats ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="mr-2 h-4 w-4" />
        )}
        WhatsApp
      </Button>
      <Button
        onClick={handlePdf}
        disabled={isDisabled || loadingPdf}
        variant="outline"
        className="w-full border-accent/40 text-accent hover:bg-accent/10 sm:w-auto"
      >
        {loadingPdf ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Relatório PDF
      </Button>
    </div>
  );
}