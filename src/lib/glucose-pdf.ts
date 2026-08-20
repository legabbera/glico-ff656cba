import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Measurement } from "./glucose.functions";
import {
  CONTEXT_LABEL,
  classifyGlucose,
  formatBR,
  summarize,
  avgByContext,
  parseDateTime,
} from "./glucose-utils";
import logoUrl from "@/assets/gllico-logo.png";

async function loadLogoDataUrl(): Promise<{ data: string; w: number; h: number }> {
  const res = await fetch(logoUrl);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => resolve({ data: r.result as string, w: img.width, h: img.height });
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function generatePdfReport(
  items: Measurement[],
  from: Date,
  to: Date,
  opts: { includeCharts?: boolean; periodLabel?: string; asBlob?: boolean } = {},
): Promise<Blob | void> {
  const { includeCharts = false, periodLabel, asBlob = false } = opts;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Logo
  try {
    const logo = await loadLogoDataUrl();
    const ratio = logo.w / logo.h;
    const height = 14; // Altura base
    const width = height * ratio;
    doc.addImage(logo.data, "PNG", 14, 10, width, height);
  } catch {
    // ignore logo failure
  }

  // Header
  doc.setTextColor(0, 128, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório de Glicose", pageW - 14, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    periodLabel ?? `Período: ${formatBR(from)} a ${formatBR(to)}`,
    pageW - 14,
    28,
    { align: "right" },
  );
  doc.text(
    `Emitido em: ${formatBR(new Date())}`,
    pageW - 14,
    33,
    { align: "right" },
  );

  // Summary
  const s = summarize(items);
  let y = 44;
  doc.setDrawColor(127, 255, 212);
  doc.setFillColor(245, 255, 250);
  doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "FD");
  doc.setTextColor(0, 128, 128);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo do período", 18, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Medições: ${s.count}`, 18, y + 14);
  doc.text(`Média: ${s.avg} mg/dL`, 60, y + 14);
  doc.text(`Mínima: ${s.min}`, 110, y + 14);
  doc.text(`Máxima: ${s.max}`, 150, y + 14);

  y += 30;

  // Reference table
  autoTable(doc, {
    startY: y,
    head: [["Faixa", "Valor (mg/dL)"]],
    body: [
      ["Baixa (Hipoglicemia)", "< 70"],
      ["Normal", "70 – 140"],
      ["Elevada", "141 – 180"],
      ["Alta", "> 180"],
    ],
    theme: "grid",
    headStyles: { fillColor: [0, 128, 128], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: pageW / 2 + 4 },
  });

  // By context table next to reference
  const ctxRows = avgByContext(items).map((c) => [
    c.label,
    String(c.count),
    `${c.avg} mg/dL`,
  ]);
  autoTable(doc, {
    startY: y,
    head: [["Contexto", "Qtd", "Média"]],
    body: ctxRows.length ? ctxRows : [["—", "—", "—"]],
    theme: "grid",
    headStyles: { fillColor: [0, 128, 128], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: pageW / 2 + 4, right: 14 },
  });

  // Measurements table
  const sorted = [...items].sort(
    (a, b) => parseDateTime(b).getTime() - parseDateTime(a).getTime(),
  );
  const body = sorted.map((m) => {
    if (m.semMedicao || m.valor == null) {
      return [
        m.data.split("-").reverse().join("/"),
        m.hora ?? "—",
        "—",
        "Sem medição",
        "—",
        m.insulina != null ? `${m.insulina}` : "—",
        [m.refeicao, m.observacoes].filter(Boolean).join(" — ") || "—",
      ];
    }
    const c = classifyGlucose(m.valor);
    return [
      m.data.split("-").reverse().join("/"),
      m.hora ?? "—",
      `${m.valor}`,
      c.label,
      m.contexto ? CONTEXT_LABEL[m.contexto] : "—",
      m.insulina != null ? `${m.insulina}` : "—",
      [m.refeicao, m.observacoes].filter(Boolean).join(" — ") || "—",
    ];
  });

  // @ts-expect-error jspdf-autotable extends doc
  const lastY = (doc.lastAutoTable?.finalY ?? y + 40) + 8;

  autoTable(doc, {
    startY: lastY,
    head: [["Data", "Hora", "mg/dL", "Faixa", "Contexto", "Insulina", "Obs."]],
    body: body.length ? body : [["—", "—", "—", "—", "—", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [0, 128, 128], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 1.8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 14 },
      2: { cellWidth: 14, halign: "right" },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 },
      5: { cellWidth: 18, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // Charts
  if (includeCharts) {
    // @ts-expect-error jspdf-autotable extends doc
    let cy = (doc.lastAutoTable?.finalY ?? lastY + 40) + 10;
    const pageH = doc.internal.pageSize.getHeight();
    if (cy > pageH - 90) {
      doc.addPage();
      cy = 20;
    }

    // === Chart 1: Linha temporal ===
    const measured = [...items]
      .filter((m) => !m.semMedicao && typeof m.valor === "number")
      .sort(
        (a, b) => parseDateTime(a).getTime() - parseDateTime(b).getTime(),
      );

    const chartX = 18;
    const chartY = cy + 8;
    const chartW = pageW - 36;
    const chartH = 60;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 128, 128);
    doc.text("Evolução da glicose", chartX, cy + 4);

    // Y scale
    const maxV = Math.max(220, ...measured.map((m) => m.valor as number));
    const minV = 40;
    const scaleY = (v: number) =>
      chartY + chartH - ((v - minV) / (maxV - minV)) * chartH;

    // Reference bands
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(254, 243, 199); // low <70 amber
    doc.rect(chartX, scaleY(70), chartW, chartY + chartH - scaleY(70), "F");
    doc.setFillColor(220, 252, 231); // 70-140 normal
    doc.rect(chartX, scaleY(140), chartW, scaleY(70) - scaleY(140), "F");
    doc.setFillColor(255, 237, 213); // 141-180 elevated
    doc.rect(chartX, scaleY(180), chartW, scaleY(140) - scaleY(180), "F");
    doc.setFillColor(254, 226, 226); // >180 high
    doc.rect(chartX, chartY, chartW, scaleY(180) - chartY, "F");

    // Axes
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.line(chartX, chartY, chartX, chartY + chartH);
    doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // Y labels
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    [70, 140, 180, maxV].forEach((v) => {
      const yy = scaleY(v);
      doc.text(String(v), chartX - 2, yy + 1.5, { align: "right" });
      doc.setDrawColor(200, 200, 200);
      doc.line(chartX, yy, chartX + chartW, yy);
    });

    // Line + points
    if (measured.length > 0) {
      const t0 = parseDateTime(measured[0]).getTime();
      const t1 = parseDateTime(measured[measured.length - 1]).getTime();
      const span = Math.max(1, t1 - t0);
      const scaleX = (t: number) => chartX + ((t - t0) / span) * chartW;

      doc.setDrawColor(0, 128, 128);
      doc.setLineWidth(0.4);
      let prev: { x: number; y: number } | null = null;
      measured.forEach((m) => {
        const x = scaleX(parseDateTime(m).getTime());
        const yy = scaleY(m.valor as number);
        if (prev) doc.line(prev.x, prev.y, x, yy);
        prev = { x, y: yy };
      });
      doc.setFillColor(0, 128, 128);
      measured.forEach((m) => {
        const x = scaleX(parseDateTime(m).getTime());
        const yy = scaleY(m.valor as number);
        doc.circle(x, yy, 0.8, "F");
      });

      // X labels (first / middle / last)
      doc.setFontSize(7);
      doc.setTextColor(90, 90, 90);
      doc.text(
        formatBR(new Date(t0)),
        chartX,
        chartY + chartH + 4,
      );
      doc.text(
        formatBR(new Date(t1)),
        chartX + chartW,
        chartY + chartH + 4,
        { align: "right" },
      );
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Sem medições no período",
        chartX + chartW / 2,
        chartY + chartH / 2,
        { align: "center" },
      );
    }

    cy = chartY + chartH + 12;

    // === Chart 2: Barras por contexto ===
    if (cy > pageH - 80) {
      doc.addPage();
      cy = 20;
    }

    const ctxData = avgByContext(items);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 128, 128);
    doc.text("Média por contexto (mg/dL)", chartX, cy + 4);

    const bY = cy + 8;
    const bH = 55;
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.line(chartX, bY, chartX, bY + bH);
    doc.line(chartX, bY + bH, chartX + chartW, bY + bH);

    if (ctxData.length > 0) {
      const maxAvg = Math.max(200, ...ctxData.map((c) => c.avg));
      const slot = chartW / ctxData.length;
      const bw = Math.min(20, slot * 0.55);
      ctxData.forEach((c, i) => {
        const bx = chartX + slot * i + (slot - bw) / 2;
        const h = (c.avg / maxAvg) * bH;
        const by = bY + bH - h;
        // color by classification
        const cl = classifyGlucose(c.avg);
        const [r, g, b] =
          cl.tone === "ok"
            ? [34, 197, 94]
            : cl.tone === "high"
              ? [249, 115, 22]
              : cl.tone === "veryhigh"
                ? [239, 68, 68]
                : [245, 158, 11];
        doc.setFillColor(r, g, b);
        doc.rect(bx, by, bw, h, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        doc.text(String(c.avg), bx + bw / 2, by - 1.5, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text(c.label, bx + bw / 2, bY + bH + 4, { align: "center" });
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "Sem dados por contexto",
        chartX + chartW / 2,
        bY + bH / 2,
        { align: "center" },
      );
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Gllico • Diário de Glicose — página ${i}/${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const filename = `gllico-relatorio-${formatBR(from).replaceAll("/", "-")}_${formatBR(to).replaceAll("/", "-")}.pdf`;
  if (asBlob) {
    return doc.output("blob");
  }
  doc.save(filename);
}