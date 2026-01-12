import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";
import logoSimple from "@/assets/logo-simple.png";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (emailSent || !sessionId) return;
      
      // Get data from URL or localStorage
      const checkoutData = localStorage.getItem("checkout_data");
      if (checkoutData) {
        try {
          const { email, name, planName, amount } = JSON.parse(checkoutData);
          await supabase.functions.invoke("send-subscription-email", {
            body: { email, name, planName, amount },
          });
          setEmailSent(true);
          localStorage.removeItem("checkout_data");
        } catch (error) {
          console.error("Error sending confirmation email:", error);
        }
      }
    };

    sendConfirmationEmail();
  }, [sessionId, emailSent]);

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
            <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
            <CardDescription className="text-base">
              Parabéns! Sua assinatura do AgendaAÍ Pro foi ativada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                <Link to="/">
                  Voltar para a página inicial
                  <ArrowRight className="w-4 h-4 ml-2" />
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
