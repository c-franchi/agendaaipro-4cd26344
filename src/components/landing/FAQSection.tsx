import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const faqItems = [
  {
    question: "O AgendaAÍ Pro é um marketplace?",
    answer: "Não! O AgendaAÍ Pro é o sistema da SUA marca. Cada cliente recebe um sistema totalmente personalizado com logo, cores e identidade próprias."
  },
  {
    question: "Como funciona o pagamento via Pix?",
    answer: "O sistema gera automaticamente um QR Code Pix para cada agendamento. O cliente pode pagar na hora da reserva ou deixar um sinal, com confirmação automática."
  },
  {
    question: "Posso vender produtos junto com os serviços?",
    answer: "Sim! O AgendaAÍ Pro permite vincular a venda de produtos ao agendamento. O cliente pode adicionar produtos e pagar tudo junto."
  },
  {
    question: "Preciso ter conhecimento técnico?",
    answer: "Não! O sistema é intuitivo e fácil de usar. Nossa equipe cuida de toda a configuração inicial e você recebe treinamento completo."
  },
  {
    question: "Posso ter um domínio próprio?",
    answer: "Sim! Oferecemos a opção de domínio personalizado para dar ainda mais profissionalismo ao seu sistema de agendamento."
  }
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm text-primary font-medium">Dúvidas Frequentes</span>
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Perguntas <span className="gradient-text">Frequentes</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre o AgendaAÍ Pro
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="glass-card border-border/50 px-6 rounded-xl overflow-hidden"
                >
                  <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors py-5">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <Button variant="heroOutline" size="lg" asChild>
              <Link to="/faq">
                Ver todas as perguntas
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
