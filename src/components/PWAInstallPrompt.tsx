import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Extend Window interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isAppMode = window.matchMedia("(display-mode: standalone)").matches || 
                     (window.navigator as any).standalone === true;
    setIsStandalone(isAppMode);
    
    if (isAppMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop Chrome install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/95 p-4 text-foreground shadow-lg backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md animate-in slide-in-from-bottom-5">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-secondary transition-colors"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 mt-1 sm:mt-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-inner">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold">Instalar Gllico</h4>
          {isIOS ? (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Para instalar o app, toque no ícone de <strong>Compartilhar</strong> na barra do Safari e depois em <strong>Adicionar à Tela de Início</strong>.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Instale o aplicativo para um acesso mais rápido e uso offline.
            </p>
          )}
        </div>
      </div>

      {!isIOS && (
        <Button 
          onClick={handleInstallClick} 
          size="sm" 
          className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Instalar agora
        </Button>
      )}
    </div>
  );
}
