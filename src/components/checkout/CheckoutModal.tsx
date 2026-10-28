import CardOrderRequest from "./CardOrderRequest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PLANS,
  PlanKey,
  formatCurrency,
  PREMIUM_CONTENT_NOTE,
  DELIVERY_NOTE,
} from "@/lib/constants";
import { getWhatsAppLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import LeadCaptureForm from "@/components/landing/LeadCaptureForm";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: PlanKey;
}

// Assisted contracting until the new system modules and billing are validated.
// Never send the new offer to historical Stripe prices.
export const CheckoutModal = ({
  open,
  onOpenChange,
  planType,
}: CheckoutModalProps) => {
  const plan = PLANS[planType];
  const summary = `Tenho interesse no plano ${plan.name} do AgendaAÍ Pro: ${formatCurrency(plan.price)}/mês e ${formatCurrency(plan.setupPrice)} de implementação única. Quero confirmar os recursos disponíveis, limites e prazo de entrega antes de contratar.`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seu sistema no plano {plan.name}</DialogTitle>
          <DialogDescription>
            Confira os valores e solicite a contratação. Confirmamos a
            disponibilidade dos recursos e o escopo antes do pagamento.
          </DialogDescription>
        </DialogHeader>
        <dl className="rounded-xl bg-secondary/50 p-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Implementação · pagamento único</dt>
            <dd className="font-semibold">{formatCurrency(plan.setupPrice)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Mensalidade após disponibilização</dt>
            <dd className="font-semibold text-primary">
              {formatCurrency(plan.price)}/mês
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Seu site recebe sua logo, cores, dados e serviços, com configuração
          inicial e painel para editar os campos disponíveis. Primeiro ano do
          domínio .com.br incluído, sujeito à disponibilidade; renovação à
          parte.
        </p>
        {planType !== "essencial" && (
          <p className="text-sm rounded-lg bg-primary/10 p-3">
            Os módulos de gestão, estoque e insumos aplicáveis ao plano estão em
            preparação. A entrega será confirmada antes da cobrança.
          </p>
        )}
        {planType === "premium" && (
          <div className="text-sm rounded-lg border border-primary/30 p-3 space-y-2">
            <p>
              Preparação inicial: até 10 imagens, 10 itens de portfólio, 1 vídeo
              curto e 2 rodadas de revisão.
            </p>
            <p>{PREMIUM_CONTENT_NOTE}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {DELIVERY_NOTE} Limites de profissionais e armazenamento, suporte e
          custos externos serão detalhados na proposta.
        </p>
        <CardOrderRequest plan={planType}/>
        <Button variant="hero" asChild>
          <a
            href={getWhatsAppLink(summary)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="w-4 h-4" />
            Conversar sobre o plano {plan.name}
          </a>
        </Button>
        <p className="text-sm font-medium">
          Ou deixe seus dados para receber a proposta
        </p>
        <LeadCaptureForm
          source={`offer_v2_${planType}`}
          initialMessage={summary}
        />
        <p className="text-xs text-center text-muted-foreground">
          Esta solicitação não gera cobrança nem ativa assinatura. Assinaturas
          existentes continuam na área da sua conta.
        </p>
      </DialogContent>
    </Dialog>
  );
};
