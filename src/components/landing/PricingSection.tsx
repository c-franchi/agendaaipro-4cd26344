import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star, Palette, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { supabase } from "@/integrations/supabase/client";

// Default background images (fallback)
import bgBarber from "@/assets/bg-professional-barber.png";
import bgManicure from "@/assets/bg-professional-manicure.png";
import bgMassage from "@/assets/bg-professional-massage.png";

interface PlanData {
  name: string;
  price: number;
  promotional_price: number | null;
  description: string;
  features: string[];
  popular: boolean;
  bg_image?: string;
}

interface PricingPlans {
  essencial: PlanData;
  pro: PlanData;
  premium: PlanData;
}

const defaultPlans: PricingPlans = {
  essencial: {
    name: "Essencial",
    price: 97,
    promotional_price: null,
    description: "Ideal para começar",
    features: [
      "Agenda online profissional",
      "Pagamento via Pix integrado",
      "Confirmação automática",
      "Painel básico de controle",
      "Suporte por email",
    ],
    popular: false,
  },
  pro: {
    name: "Pro",
    price: 197,
    promotional_price: null,
    description: "Mais vendido",
    features: [
      "Tudo do Essencial",
      "Venda de produtos integrada",
      "Controle financeiro completo",
      "Relatórios detalhados",
      "Personalização da marca",
      "Suporte prioritário",
    ],
    popular: true,
  },
  premium: {
    name: "Premium",
    price: 397,
    promotional_price: null,
    description: "Para quem quer tudo",
    features: [
      "Tudo do Pro",
      "Personalização completa",
      "Domínio próprio incluso",
      "Múltiplos profissionais",
      "API para integrações",
      "Gerente de conta dedicado",
    ],
    popular: false,
  },
};

const defaultBgImages = {
  essencial: bgBarber,
  pro: bgManicure,
  premium: bgMassage,
};

const brandingNotes = {
  essencial: { note: "Banners e logos: serviço avulso*", included: false },
  pro: { note: "Banners e logos: serviço avulso*", included: false },
  premium: { note: "Criação de banners e logos inclusos", included: true },
};

const PricingSection = () => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    planType: string;
    name: string;
    price: number;
    promotional_price: number | null;
  } | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlans>(defaultPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_content")
          .select("value")
          .eq("key", "pricing_plans")
          .maybeSingle();

        if (error) throw error;
        if (data?.value) {
          setPricingPlans(data.value as unknown as PricingPlans);
        }
      } catch (error) {
        console.error("Error fetching pricing plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleContractClick = (planKey: string, plan: PlanData) => {
    setSelectedPlan({
      planType: planKey,
      name: plan.name,
      price: plan.promotional_price || plan.price,
      promotional_price: plan.promotional_price,
    });
    setCheckoutOpen(true);
  };

  const plansArray = Object.entries(pricingPlans).map(([key, plan]) => ({
    ...plan,
    planType: key,
    bgImage: plan.bg_image || defaultBgImages[key as keyof typeof defaultBgImages],
    branding: brandingNotes[key as keyof typeof brandingNotes],
  }));

  return (
    <section id="planos" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images with transparency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-1/3 h-full bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${plansArray[0]?.bgImage || bgBarber})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/3 h-full bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${plansArray[2]?.bgImage || bgMassage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">Planos e Preços</span>
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos <span className="gradient-text">a partir de</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Solicite uma proposta personalizada para seu negócio
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plansArray.map((plan, index) => (
            <motion.div
              key={plan.planType}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-8 relative overflow-hidden ${
                plan.popular
                  ? "border-primary/50 shadow-lg shadow-primary/10 scale-105"
                  : ""
              }`}
            >
              {/* Background image for each card */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.05]"
                style={{ backgroundImage: `url(${plan.bgImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/95 to-card/80" />
              
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="relative z-10">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    {plan.promotional_price ? (
                      <>
                        <span className="text-lg text-muted-foreground line-through mr-2">
                          R$ {plan.price}
                        </span>
                        <span className="text-4xl font-bold gradient-text">
                          R$ {plan.promotional_price}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold gradient-text">
                        R$ {plan.price}
                      </span>
                    )}
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {plan.promotional_price && (
                    <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                      Promoção ativa!
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Branding info */}
                <div className={`p-3 rounded-lg mb-6 ${plan.branding.included ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 border border-border/30'}`}>
                  <div className="flex items-start gap-2">
                    {plan.branding.included ? (
                      <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <Palette className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-xs ${plan.branding.included ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {plan.branding.note}
                      </p>
                      {!plan.branding.included && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Não tem logo? Criamos para você!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant={plan.popular ? "hero" : "heroOutline"}
                  className="w-full"
                  onClick={() => handleContractClick(plan.planType, plan)}
                >
                  Contratar agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Branding services info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="glass-card p-6 text-center border border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Image className="w-5 h-5 text-primary" />
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Serviço de Criação de Identidade Visual</h4>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Não possui banners, logotipo ou cartão de visita digital?</span> Nossa equipe pode criar para você! 
              Nos planos <span className="text-primary font-medium">Essencial</span> e <span className="text-primary font-medium">Pro</span>, 
              este serviço é oferecido de forma avulsa. No plano <span className="text-primary font-medium">Premium</span>, 
              a criação de toda identidade visual já está <span className="text-primary font-medium">inclusa no valor</span>.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-3">
              * Valores de criação avulsa: Logo a partir de R$ 150 | Banners a partir de R$ 80 | Cartão de visita digital a partir de R$ 50
            </p>
          </div>
        </motion.div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <CheckoutModal
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          planType={selectedPlan.planType}
          planName={selectedPlan.name}
          originalPrice={selectedPlan.price}
        />
      )}
    </section>
  );
};

export default PricingSection;