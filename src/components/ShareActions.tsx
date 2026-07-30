import { useState } from "react";
import { FileDown, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Measurement } from "@/lib/glucose.functions";
import { buildWhatsAppReport, whatsappLink } from "@/lib/glucose-utils";
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

  const handleWhats = () => {
    const text = buildWhatsAppReport(items, from, to, periodLabel);
    window.open(whatsappLink(text), "_blank");
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
        disabled={isDisabled}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
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