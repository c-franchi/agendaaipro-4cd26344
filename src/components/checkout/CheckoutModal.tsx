import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VoucherInput } from "./VoucherInput";
import { CreditCard, Loader2, ArrowRight, LogIn } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: string;
  planName: string;
  originalPrice: number;
}

const checkoutSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
});

export const CheckoutModal = ({
  open,
  onOpenChange,
  planType,
  planName,
  originalPrice,
}: CheckoutModalProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [voucherData, setVoucherData] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    voucherId: string;
    validityMonths: number;
  } | null>(null);

  const finalPrice = voucherData ? voucherData.finalAmount : originalPrice;
  const discountAmount = voucherData ? voucherData.discountAmount : 0;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        setEmail(user.email || "");
        // Try to get user's name from metadata if available
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (userName) setName(userName);
      } else {
        setIsAuthenticated(false);
      }
      setCheckingAuth(false);
    };

    if (open) {
      checkAuth();
    }
  }, [open]);

  const handleLoginRedirect = () => {
    // Store checkout data for after login
    localStorage.setItem("pending_checkout", JSON.stringify({
      planType,
      planName,
      originalPrice,
      voucherData,
    }));
    onOpenChange(false);
    navigate("/auth?redirect=checkout");
  };

  const handleCheckout = async () => {
    try {
      // Validate form
      const validation = checkoutSchema.safeParse({ name, email });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setLoading(true);
      console.log("[CHECKOUT] Starting checkout process...", { planType, email, name, voucherData, originalPrice, discountAmount, finalPrice });

      // Always use Stripe checkout - even for 100% discount (to collect card for renewal)
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          planType,
          email,
          name,
          voucherCode: voucherData?.code,
          originalAmount: originalPrice,
          discountAmount,
          finalAmount: finalPrice,
        },
      });

      console.log("[CHECKOUT] Response:", { data, error });

      if (error) {
        console.error("[CHECKOUT] Function error:", error);
        throw error;
      }

      if (data?.url) {
        // Get validity months from voucher data
        const validityMonths = voucherData?.validityMonths || 1;
        
        // Save checkout data for confirmation page
        localStorage.setItem("checkout_data", JSON.stringify({
          email,
          name,
          planName,
          planType,
          originalAmount: originalPrice,
          discountAmount,
          finalAmount: finalPrice,
          voucherCode: voucherData?.code || null,
          voucherValidityMonths: validityMonths,
        }));
        
        console.log("[CHECKOUT] Opening Stripe URL:", data.url);
        
        // Try to open in new tab, fallback to redirect
        const newWindow = window.open(data.url, "_blank");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log("[CHECKOUT] Popup blocked, redirecting...");
          window.location.href = data.url;
        } else {
          toast.success("Redirecionando para o pagamento...");
          onOpenChange(false);
        }
      } else {
        console.error("[CHECKOUT] No URL returned:", data);
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      console.error("[CHECKOUT] Error:", err);
      toast.error(err.message || "Erro ao processar checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5 text-primary" />
              Faça login para continuar
            </DialogTitle>
            <DialogDescription>
              Para contratar o {planName}, você precisa criar uma conta ou fazer login.
              Isso permitirá que você gerencie sua assinatura futuramente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plan Summary */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plano selecionado</span>
                  <span className="font-semibold">{planName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold text-primary">
                    R$ {originalPrice.toFixed(2)}/mês
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">Por que criar uma conta?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Gerencie sua assinatura a qualquer momento</li>
                <li>✓ Acesse o painel de controle</li>
                <li>✓ Receba atualizações e suporte exclusivo</li>
                <li>✓ Seu cartão fica salvo para renovação automática</li>
              </ul>
            </div>

            <Button
              onClick={handleLoginRedirect}
              className="w-full h-12 text-base"
              size="lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Criar conta ou Fazer login
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Após o login, você será redirecionado para finalizar a contratação.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Finalizar Contratação
          </DialogTitle>
          <DialogDescription>
            Complete seus dados para contratar o {planName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-semibold">{planName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor original</span>
                <span className={discountAmount > 0 ? "line-through text-muted-foreground" : "font-semibold"}>
                  R$ {originalPrice.toFixed(2)}/mês
                </span>
              </div>
              <AnimatePresence>
                {discountAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-between items-center text-green-500"
                  >
                    <span>Desconto aplicado</span>
                    <span className="font-semibold">-R$ {discountAmount.toFixed(2)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {finalPrice === 0 
                    ? `Grátis (${voucherData?.validityMonths === 1 ? "1º mês" : `${voucherData?.validityMonths || 1} meses`})` 
                    : `R$ ${finalPrice.toFixed(2)}/mês`}
                </span>
              </div>
              {finalPrice === 0 && (
                <p className="text-xs text-muted-foreground">
                  * Seu cartão será salvo para renovação automática após o período promocional.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Customer Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isAuthenticated}
              />
              {isAuthenticated && (
                <p className="text-xs text-muted-foreground">
                  Email vinculado à sua conta
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Voucher */}
          <VoucherInput
            email={email}
            planType={planType}
            originalAmount={originalPrice}
            onVoucherApplied={setVoucherData}
          />

          <Separator />

          {/* CTA */}
          <Button
            onClick={handleCheckout}
            disabled={loading || !name.trim() || !email.trim()}
            className="w-full h-12 text-base"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {finalPrice === 0 ? "Ativar Plano Grátis" : `Pagar R$ ${finalPrice.toFixed(2)}/mês`}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento seguro processado pelo Stripe. Você será redirecionado para finalizar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
