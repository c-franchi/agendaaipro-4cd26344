import { motion } from "framer-motion";
import { MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadCaptureForm from "./LeadCaptureForm";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";

const ContactSection = () => {
  return (
    <section id="contato-form" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Pronto para transformar{" "}
              <span className="gradient-text">o seu negócio?</span>
            </h2>
            
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-lg leading-relaxed">
              Preencha o formulário e nossa equipe entrará em contato para apresentar uma proposta personalizada para o seu negócio.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-sm">(16) 99781-3038</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">E-mail</p>
                  <p className="text-sm">contato@agendaai.pro</p>
                </div>
              </div>
            </div>

            <a href={getWhatsAppLink(getWhatsAppMessage("hero"))} target="_blank" rel="noopener noreferrer">
              <Button variant="heroOutline" size="lg" className="w-full sm:w-auto min-h-[48px]">
                <MessageCircle className="w-5 h-5" />
                Falar com especialista
              </Button>
            </a>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 md:p-8 rounded-2xl"
          >
            <h3 className="text-xl font-semibold mb-6">Solicitar Proposta</h3>
            <LeadCaptureForm source="contact_section" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
