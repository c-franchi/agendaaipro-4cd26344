import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Background images
import bgBarber from "@/assets/bg-professional-barber.png";
import bgFitness from "@/assets/bg-professional-fitness.png";

const CTASection = () => {
  return (
    <section id="contato" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: `url(${bgBarber})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-[0.08]"
          style={{ backgroundImage: `url(${bgFitness})` }}
        />
      </div>
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Tenha sua própria agenda profissional e{" "}
            <span className="gradient-text">aumente seu faturamento.</span>
          </h2>
          
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Comece agora e transforme a forma como você gerencia seus atendimentos, pagamentos e vendas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              Quero o AgendaAÍ Pro
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
