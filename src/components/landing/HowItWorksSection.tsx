import { motion } from "framer-motion";
import { Calendar, ShoppingBag, CreditCard, ClipboardCheck, ThumbsUp } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    step: "1",
    title: "O cliente agenda online",
    description: "Escolhe o melhor horário disponível direto no sistema",
  },
  {
    icon: ShoppingBag,
    step: "2",
    title: "Escolhe serviço e produtos",
    description: "Pode adicionar produtos ao agendamento se desejar",
  },
  {
    icon: CreditCard,
    step: "3",
    title: "Realiza o pagamento",
    description: "Pagamento ou sinal via Pix de forma automática",
  },
  {
    icon: ClipboardCheck,
    step: "4",
    title: "Profissional recebe organizado",
    description: "Tudo confirmado e pronto no painel de controle",
  },
  {
    icon: ThumbsUp,
    step: "5",
    title: "Atendimento sem imprevistos",
    description: "Cliente confirmado, pagamento garantido",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como <span className="gradient-text">funciona?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Um fluxo simples e eficiente do agendamento ao atendimento
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden md:block" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`flex flex-col md:flex-row items-center gap-6 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="glass-card p-6 card-hover inline-block max-w-sm">
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </div>
                </div>

                <div className="relative z-10 w-16 h-16 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-lg">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
