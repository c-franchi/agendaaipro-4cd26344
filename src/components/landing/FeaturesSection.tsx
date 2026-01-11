import { motion, useScroll, useTransform } from "framer-motion";
import { Calendar, CreditCard, ShoppingCart, BarChart3, MessageSquare, Palette } from "lucide-react";
import { useRef } from "react";

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description: "Sistema que evita conflitos de horários automaticamente",
    highlight: "Sem conflitos",
  },
  {
    icon: CreditCard,
    title: "Pagamentos via Pix",
    description: "Receba pagamentos e sinais de forma automática e segura",
    highlight: "Automático",
  },
  {
    icon: ShoppingCart,
    title: "Venda de produtos",
    description: "Vincule produtos ao agendamento e aumente seu faturamento",
    highlight: "Integrado",
  },
  {
    icon: BarChart3,
    title: "Controle financeiro",
    description: "Dashboard completo com relatórios e análises de vendas",
    highlight: "Completo",
  },
  {
    icon: MessageSquare,
    title: "Comunicação",
    description: "Comunicação direta com clientes via sistema integrado",
    highlight: "Direto",
  },
  {
    icon: Palette,
    title: "Sua marca",
    description: "Sistema totalmente personalizado com sua identidade visual",
    highlight: "Exclusivo",
  },
];

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section ref={sectionRef} id="funcionalidades" className="py-20 md:py-32 relative overflow-hidden">
      {/* Parallax background elements */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -50]) }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
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
            <span className="text-sm text-primary font-medium">Recursos Completos</span>
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Funcionalidades <span className="gradient-text">principais</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo que você precisa para profissionalizar seus atendimentos
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 300 }
              }}
              className="glass-card p-8 card-hover group relative overflow-hidden"
            >
              {/* Animated gradient background on hover */}
              <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(circle at 50% 0%, hsla(180, 85%, 50%, 0.1), transparent 70%)"
                }}
              />
              
              {/* Animated border glow */}
              <motion.div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: "inset 0 0 20px hsla(180, 85%, 50%, 0.1)"
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                  >
                    <feature.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <motion.span 
                    className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full"
                    whileHover={{ scale: 1.05 }}
                  >
                    {feature.highlight}
                  </motion.span>
                </div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
