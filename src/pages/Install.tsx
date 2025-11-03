import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="gradient-primary w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-3xl font-bold">Instalează MoneyTracker</h1>
          
          {isInstalled ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="h-6 w-6" />
                <p className="text-lg font-medium">Aplicația este instalată!</p>
              </div>
              <Link to="/">
                <Button className="w-full">Deschide aplicația</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                Instalează MoneyTracker pe dispozitivul tău pentru o experiență mai bună.
                Aplicația va funcționa offline și va fi rapid accesibilă de pe ecranul principal.
              </p>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  size="lg"
                  className="w-full"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Instalează acum
                </Button>
              ) : (
                <div className="space-y-4 text-left">
                  <h2 className="text-xl font-semibold text-center">Cum să instalezi:</h2>
                  
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Pe Android (Chrome):</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Apasă pe meniul cu 3 puncte (⋮)</li>
                        <li>Selectează "Instalează aplicația" sau "Adaugă la ecranul de pornire"</li>
                        <li>Confirmă instalarea</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Pe iOS (Safari):</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Apasă pe butonul de "Share" (pătratul cu săgeată)</li>
                        <li>Derulează și selectează "Adaugă la ecranul de pornire"</li>
                        <li>Apasă "Adaugă"</li>
                      </ol>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">Pe Desktop (Chrome/Edge):</h3>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Caută iconița de instalare în bara de adrese</li>
                        <li>Apasă pe "Instalează" sau folosește meniul browser-ului</li>
                        <li>Confirmă instalarea</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              <Link to="/">
                <Button variant="outline" className="w-full">
                  Continuă în browser
                </Button>
              </Link>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Install;