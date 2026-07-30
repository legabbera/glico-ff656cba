import { cn } from "@/lib/utils";

interface MeshGradientProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function MeshGradient({ className, ...props }: MeshGradientProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none -z-10",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 bg-grid-pattern opacity-[0.35]"
        style={{
          maskImage: "radial-gradient(ellipse at center, black, transparent 80%)",
        }}
      />
      
      {/* Orb 1: Accent */}
      <div className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full bg-accent/20 blur-[120px] mix-blend-multiply animate-mesh-1 dark:mix-blend-screen" />
      
      {/* Orb 2: Primary */}
      <div className="absolute top-[20%] -right-[10%] h-[70%] w-[50%] rounded-full bg-primary/15 blur-[100px] mix-blend-multiply animate-mesh-2 dark:mix-blend-screen" />
      
      {/* Orb 3: Accent Lighter */}
      <div className="absolute -bottom-[20%] left-[10%] h-[50%] w-[60%] rounded-full bg-accent/15 blur-[130px] mix-blend-multiply animate-mesh-3 dark:mix-blend-screen" />

      {/* Orb 4: Primary deep */}
      <div className="absolute bottom-[10%] right-[20%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[90px] mix-blend-multiply animate-mesh-4 dark:mix-blend-screen" />
    </div>
  );
}
