import { cn } from "@/lib/utils";

export type DiabetesType = "tipo1" | "tipo2";

export function DiabetesTypeSlider({
  value,
  onChange,
  className,
}: {
  value: DiabetesType | null | undefined;
  onChange: (v: DiabetesType) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid h-11 w-full grid-cols-2 rounded-full border border-border bg-muted p-1 text-sm font-medium",
        className,
      )}
      role="radiogroup"
      aria-label="Tipo de diabetes"
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent shadow transition-transform duration-200 ease-out",
          value === "tipo2" && "translate-x-full",
        )}
      />
      {(["tipo1", "tipo2"] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "relative z-10 flex items-center justify-center rounded-full transition-colors",
            value === t ? "text-accent-foreground" : "text-foreground/70",
          )}
        >
          {t === "tipo1" ? "Tipo 1" : "Tipo 2"}
        </button>
      ))}
    </div>
  );
}