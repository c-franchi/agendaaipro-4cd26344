import { motion } from "framer-motion";
import { Check, ArrowRight, Image, Palette, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Essencial",
    description: "Ideal para começar",
    features: [
      "Agenda online profissional",
      "Pagamento via Pix integrado",
      "Confirmação automática",
      "Painel básico de controle",
      "Suporte por email",
    ],
    brandingNote: "Banners e logos: serviço avulso*",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "Mais vendido",
    features: [
      "Tudo do Essencial",
      "Venda de produtos integrada",
      "Controle financeiro completo",
      "Relatórios detalhados",
      "Personalização da marca",
      "Suporte prioritário",
    ],
    brandingNote: "Banners e logos: serviço avulso*",
    highlighted: true,
  },
  {
    name: "Premium",
    description: "Para quem quer tudo",
    features: [
      "Tudo do Pro",
      "Personalização completa",
      "Domínio próprio incluso",
      "Múltiplos profissionais",
      "API para integrações",
      "Gerente de conta dedicado",
    ],
    brandingNote: "Criação de banners e logos inclusos",
    brandingIncluded: true,
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="planos" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images with transparency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos que <span className="gradient-text">cabem no seu bolso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Valores variam conforme personalização e necessidades do negócio
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-8 relative ${
                plan.highlighted
                  ? "border-primary/50 shadow-lg shadow-primary/10"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Branding info */}
              <div className={`p-3 rounded-lg mb-6 ${plan.brandingIncluded ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50 border border-border/30'}`}>
                <div className="flex items-start gap-2">
                  {plan.brandingIncluded ? (
                    <Star className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <Palette className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-xs ${plan.brandingIncluded ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {plan.brandingNote}
                    </p>
                    {!plan.brandingIncluded && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Não tem logo? Criamos para você!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant={plan.highlighted ? "hero" : "heroOutline"}
                className="w-full"
              >
                Solicitar proposta
                <ArrowRight className="w-4 h-4" />
              </Button>
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
              <span className="text-foreground font-medium">Não possui banners ou logotipo?</span> Nossa equipe pode criar para você! 
              Nos planos <span className="text-primary font-medium">Essencial</span> e <span className="text-primary font-medium">Pro</span>, 
              este serviço é oferecido de forma avulsa. No plano <span className="text-primary font-medium">Premium</span>, 
              a criação de toda identidade visual já está <span className="text-primary font-medium">inclusa no valor</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
