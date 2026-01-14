import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, ShoppingBag, CreditCard, ClipboardCheck, ThumbsUp } from "lucide-react";
import { useRef } from "react";

// Background images
import bgTattoo from "@/assets/bg-professional-tattoo.png";
import bgBarber from "@/assets/bg-professional-barber.png";

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
    title: "Escolhe serviço e produtos (opcional)",
    description: "Pode adicionar produtos ao agendamento, aumentando seu ticket",
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
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section ref={sectionRef} id="como-funciona" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-[0.15]"
          style={{ backgroundImage: `url(${bgTattoo})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-[0.15]"
          style={{ backgroundImage: `url(${bgBarber})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      {/* Parallax background gradient */}
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" 
      />
      
      {/* Floating elements */}
      <motion.div 
        style={{ 
          y: useTransform(scrollYProgress, [0, 1], [0, -100]),
          x: useTransform(scrollYProgress, [0, 1], [0, 50])
        }}
        className="absolute top-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
      />
      <motion.div 
        style={{ 
          y: useTransform(scrollYProgress, [0, 1], [0, 100]),
          x: useTransform(scrollYProgress, [0, 1], [0, -30])
        }}
        className="absolute bottom-20 left-10 w-40 h-40 bg-accent/10 rounded-full blur-2xl"
      />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">Processo Simples</span>
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Como <span className="gradient-text">funciona?</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Um fluxo simples e eficiente, do agendamento ao atendimento
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Animated Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30 hidden md:block">
            <motion.div 
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary to-primary/50"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-10 md:space-y-16">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 50, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15
                }}
                className={`flex flex-col md:flex-row items-center gap-6 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <motion.div 
                  className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div 
                    className="glass-card p-6 card-hover inline-block max-w-sm relative overflow-hidden group"
                    whileHover={{ y: -5 }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/10 to-transparent" />
                    
                    <div className="relative z-10">
                      <motion.span 
                        className="inline-block text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded mb-2"
                        whileHover={{ scale: 1.1 }}
                      >
                        Passo {item.step}
                      </motion.span>
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="relative z-10 w-16 h-16 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-lg"
                  whileHover={{ 
                    scale: 1.15, 
                    boxShadow: "0 0 30px hsla(180, 85%, 50%, 0.4)"
                  }}
                  whileInView={{
                    scale: [0.8, 1.1, 1],
                    transition: { delay: index * 0.15 + 0.3 }
                  }}
                  viewport={{ once: true }}
                >
                  <item.icon className="w-7 h-7 text-primary" />
                </motion.div>

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
