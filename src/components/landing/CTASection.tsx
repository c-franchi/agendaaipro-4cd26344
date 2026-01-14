import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";

// Background images
import bgBarber from "@/assets/bg-professional-barber.png";
import bgFitness from "@/assets/bg-professional-fitness.png";

const CTASection = () => {
  return (
    <section id="contato" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${bgBarber})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-[0.18]"
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            Pronto para profissionalizar seus atendimentos e{" "}
            <span className="gradient-text">aumentar seu faturamento?</span>
          </h2>
          
          <p className="text-muted-foreground text-base sm:text-lg mb-4 max-w-xl mx-auto leading-relaxed">
            Tenha agora o sistema da sua marca — não um app genérico.
          </p>
          
          <p className="text-sm text-primary/80 mb-8">
            ⚡ Configuração rápida. Comece a usar em poucos dias.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#planos">
              <Button variant="hero" size="xl" className="w-full sm:w-auto min-h-[52px]">
                Quero meu sistema profissional
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
            <a href={getWhatsAppLink(getWhatsAppMessage("cta"))} target="_blank" rel="noopener noreferrer">
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto min-h-[52px]">
                <MessageCircle className="w-5 h-5" />
                Falar com especialista
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
