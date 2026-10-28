import { OFFER_FAQS } from "@/lib/constants";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight } from "lucide-react";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";

const faqData = [
  { category: "Planos, personalização e contratação", questions: OFFER_FAQS },
];

const FAQ = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <span className="text-sm text-primary font-medium">
                  Central de Ajuda
                </span>
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Perguntas <span className="gradient-text">Frequentes</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground text-balance leading-relaxed">
                Encontre respostas para as dúvidas mais comuns sobre o AgendaAÍ
                Pro. Não encontrou o que procura? Fale com nossa equipe!
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {faqData.map((category, categoryIndex) => (
                <motion.div
                  key={category.category}
                  variants={itemVariants}
                  className="mb-12"
                >
                  <h2 className="text-2xl font-bold mb-6 gradient-text">
                    {category.category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {category.questions.map((item, questionIndex) => (
                      <AccordionItem
                        key={questionIndex}
                        value={`${categoryIndex}-${questionIndex}`}
                        className="glass-card border-border/50 px-6 rounded-xl overflow-hidden"
                      >
                        <AccordionTrigger className="text-left hover:no-underline hover:text-primary transition-colors py-5">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 md:p-12 text-center rounded-2xl border-primary/20"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ainda tem dúvidas?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                Nossa equipe está pronta para ajudar você a transformar o seu
                negócio com o AgendaAÍ Pro.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="hero"
                  size="lg"
                  className="min-h-[48px]"
                  asChild
                >
                  <a
                    href={getWhatsAppLink(getWhatsAppMessage("faq"))}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Falar com especialista
                  </a>
                </Button>
                <Button
                  variant="heroOutline"
                  size="lg"
                  className="min-h-[48px]"
                  onClick={() => {
                    window.location.href = "/#planos";
                    setTimeout(() => {
                      const element = document.getElementById("planos");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100);
                  }}
                >
                  Ver Planos
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
