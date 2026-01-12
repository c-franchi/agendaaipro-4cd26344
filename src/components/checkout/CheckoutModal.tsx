import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { VoucherInput } from "./VoucherInput";
import { CreditCard, Loader2, Check, ArrowRight } from "lucide-react";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [voucherData, setVoucherData] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    voucherId: string;
  } | null>(null);

  const finalPrice = voucherData ? voucherData.finalAmount : originalPrice;
  const discountAmount = voucherData ? voucherData.discountAmount : 0;

  const handleCheckout = async () => {
    try {
      // Validate form
      const validation = checkoutSchema.safeParse({ name, email });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      setLoading(true);

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

      if (error) throw error;

      if (data?.url) {
        // Save checkout data for confirmation email
        localStorage.setItem("checkout_data", JSON.stringify({
          email,
          name,
          planName,
          amount: finalPrice,
        }));
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o pagamento...");
        onOpenChange(false);
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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
                  R$ {finalPrice.toFixed(2)}/mês
                </span>
              </div>
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
              />
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
                Pagar R$ {finalPrice.toFixed(2)}/mês
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
