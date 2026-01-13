import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, MessageCircle, Calendar, CreditCard, Tag } from "lucide-react";
import logoSimple from "@/assets/logo-simple.png";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutData {
  email: string;
  name: string;
  planName: string;
  planType: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  voucherCode: string | null;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const isFree = searchParams.get("free") === "true";
  const [emailSent, setEmailSent] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    // Get checkout data from localStorage
    const storedData = localStorage.getItem("checkout_data");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setCheckoutData(parsed);
      } catch (error) {
        console.error("Error parsing checkout data:", error);
      }
    }
  }, []);

  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (emailSent || (!sessionId && !isFree)) return;
      
      if (checkoutData) {
        try {
          await supabase.functions.invoke("send-subscription-email", {
            body: { 
              email: checkoutData.email, 
              name: checkoutData.name, 
              planName: checkoutData.planName, 
              amount: checkoutData.finalAmount 
            },
          });
          setEmailSent(true);
          localStorage.removeItem("checkout_data");
        } catch (error) {
          console.error("Error sending confirmation email:", error);
        }
      }
    };

    sendConfirmationEmail();
  }, [sessionId, isFree, emailSent, checkoutData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto">
              <img src={logoSimple} alt="AgendaAÍ Pro" className="h-12 mx-auto mb-4" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </motion.div>
            <CardTitle className="text-2xl">
              {isFree ? "Assinatura Ativada!" : "Pagamento Confirmado!"}
            </CardTitle>
            <CardDescription className="text-base">
              Parabéns! Sua assinatura do AgendaAÍ Pro foi ativada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Details */}
            {checkoutData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-muted/30 rounded-lg p-4 space-y-3 text-left"
              >
                <h3 className="font-semibold text-center mb-3">Detalhes da sua assinatura</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Plano</span>
                  </div>
                  <span className="font-semibold">{checkoutData.planName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Valor original</span>
                  </div>
                  <span className={checkoutData.discountAmount > 0 ? "line-through text-muted-foreground" : ""}>
                    {formatCurrency(checkoutData.originalAmount)}/mês
                  </span>
                </div>

                {checkoutData.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-green-500">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm">Desconto</span>
                    </div>
                    <span className="font-semibold">-{formatCurrency(checkoutData.discountAmount)}</span>
                  </div>
                )}

                {checkoutData.voucherCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Voucher aplicado</span>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                      {checkoutData.voucherCode}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {checkoutData.finalAmount === 0 
                        ? "Grátis (1º mês)" 
                        : `${formatCurrency(checkoutData.finalAmount)}/mês`
                      }
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Próximos passos:</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>✓ Você receberá um email com os detalhes da assinatura</li>
                <li>✓ Nossa equipe entrará em contato em até 24h</li>
                <li>✓ Iniciaremos a configuração do seu sistema personalizado</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <a
                  href={getWhatsAppLink(getWhatsAppMessage("success"))}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Falar com nossa equipe
                </a>
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link to="/minha-assinatura">
                  Gerenciar minha assinatura
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/">
                  Voltar para a página inicial
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
