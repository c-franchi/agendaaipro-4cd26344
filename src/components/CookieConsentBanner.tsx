import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CONSENT_KEY = "cookie_consent";
const CONSENT_PREFERENCES_KEY = "cookie_preferences";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(CONSENT_KEY, "true");
    localStorage.setItem(CONSENT_PREFERENCES_KEY, JSON.stringify(prefs));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    setPreferences(essentialOnly);
    saveConsent(essentialOnly);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {!showSettings ? (
              // Main Banner
              <div className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                    <Cookie className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Cookie className="w-5 h-5 text-primary sm:hidden" />
                      Respeitamos sua privacidade
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                      Ao continuar navegando, você concorda com nossa{" "}
                      <Link to="/privacidade" className="text-primary hover:underline">
                        Política de Privacidade
                      </Link>{" "}
                      e{" "}
                      <Link to="/termos" className="text-primary hover:underline">
                        Termos de Uso
                      </Link>.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button onClick={handleAcceptAll} className="flex-1 sm:flex-initial">
                        Aceitar Todos
                      </Button>
                      <Button 
                        onClick={handleAcceptEssential} 
                        variant="outline" 
                        className="flex-1 sm:flex-initial"
                      >
                        Apenas Essenciais
                      </Button>
                      <Button 
                        onClick={() => setShowSettings(true)} 
                        variant="ghost" 
                        className="flex-1 sm:flex-initial"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                  <button
                    onClick={handleAcceptEssential}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ) : (
              // Settings Panel
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Configurar Cookies</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  {/* Essential Cookies */}
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Cookies Essenciais</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Necessários para o funcionamento básico do site. Não podem ser desativados.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-1 h-4 w-4 rounded border-border"
                    />
                  </div>
                  
                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Cookies de Análise</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Nos ajudam a entender como os visitantes interagem com o site para melhorar a experiência.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    />
                  </div>
                  
                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Cookies de Marketing</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Usados para exibir anúncios relevantes e medir a eficácia das campanhas.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className="mt-1 h-4 w-4 rounded border-border accent-primary"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleSavePreferences} className="flex-1">
                    Salvar Preferências
                  </Button>
                  <Button onClick={handleAcceptAll} variant="outline" className="flex-1">
                    Aceitar Todos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
