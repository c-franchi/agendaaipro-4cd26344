import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
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
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="planos" className="py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
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

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

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
      </div>
    </section>
  );
};

export default PricingSection;
