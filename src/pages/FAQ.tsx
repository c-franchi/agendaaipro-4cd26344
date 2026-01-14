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
  {
    category: "Sobre o AgendaAÍ Pro",
    questions: [
      {
        question: "O que é o AgendaAÍ Pro?",
        answer: "O AgendaAÍ Pro é um sistema profissional de agenda digital personalizado para o seu negócio. Diferente de marketplaces, cada profissional tem seu próprio sistema com sua marca, agenda, pagamentos via Pix e controle de vendas integrado."
      },
      {
        question: "Para quem é o AgendaAÍ Pro?",
        answer: "O sistema foi desenvolvido para profissionais autônomos e estabelecimentos de beleza e estética, incluindo barbeiros, cabeleireiros, manicures, esteticistas, depiladoras e outros profissionais que trabalham com agendamento."
      },
      {
        question: "O AgendaAÍ Pro é um marketplace?",
        answer: "Não! O AgendaAÍ Pro é o sistema da SUA marca. Cada cliente recebe um sistema totalmente personalizado com logo, cores e identidade próprias. Seus clientes agendam diretamente com você, sem intermediários."
      },
      {
        question: "Preciso ter conhecimento técnico para usar?",
        answer: "Não! O sistema foi desenvolvido para ser intuitivo e fácil de usar. Nossa equipe cuida de toda a configuração inicial e você recebe treinamento completo para gerenciar sua agenda."
      }
    ]
  },
  {
    category: "Funcionalidades",
    questions: [
      {
        question: "Como funciona o agendamento online?",
        answer: "Seus clientes acessam seu link personalizado, escolhem o serviço desejado, selecionam data e horário disponíveis, e confirmam o agendamento. O sistema evita automaticamente conflitos de horários."
      },
      {
        question: "Posso vender produtos junto com os serviços?",
        answer: "Sim! O AgendaAÍ Pro permite vincular a venda de produtos ao agendamento. O cliente pode adicionar produtos ao carrinho durante o agendamento e pagar tudo junto."
      },
      {
        question: "Como funciona o pagamento via Pix?",
        answer: "O sistema gera automaticamente um QR Code Pix para cada agendamento. O cliente pode pagar na hora da reserva ou deixar um sinal. Você recebe confirmação automática do pagamento."
      },
      {
        question: "Tenho controle financeiro no sistema?",
        answer: "Sim! O AgendaAÍ Pro oferece relatórios completos de faturamento, serviços mais realizados, produtos mais vendidos e histórico de pagamentos. Tudo para você ter controle total do seu negócio."
      },
      {
        question: "Consigo me comunicar com os clientes pelo sistema?",
        answer: "Sim! O sistema envia lembretes automáticos de agendamento e você pode enviar mensagens personalizadas para seus clientes sobre promoções, novidades ou confirmações."
      }
    ]
  },
  {
    category: "Personalização",
    questions: [
      {
        question: "Posso usar minha própria logo e cores?",
        answer: "Absolutamente! O sistema é 100% personalizável. Você pode usar sua logo, definir as cores da sua marca e ter uma identidade visual única que representa seu negócio."
      },
      {
        question: "Posso ter um domínio próprio?",
        answer: "Sim! Oferecemos a opção de domínio personalizado (ex: www.seunegocio.com.br) para dar ainda mais profissionalismo e credibilidade ao seu sistema de agendamento."
      },
      {
        question: "Quanto tempo leva para personalizar meu sistema?",
        answer: "Após a contratação e envio de todos os dados necessários (logo, cores, informações do negócio), seu sistema personalizado fica pronto em até 5 dias úteis. O prazo pode variar conforme a complexidade da personalização e a rapidez no envio das informações solicitadas. Nossa equipe cuida de toda a configuração e você recebe tudo pronto para usar."
      }
    ]
  },
  {
    category: "Planos e Pagamento",
    questions: [
      {
        question: "Quais são os planos disponíveis?",
        answer: "Oferecemos três planos: Essencial (agenda + pagamento Pix), Pro (tudo do Essencial + venda de produtos + controle financeiro) e Premium (personalização completa + suporte prioritário). Os valores variam conforme a necessidade do seu negócio."
      },
      {
        question: "Existe período de teste gratuito?",
        answer: "Sim! Oferecemos um período de demonstração para você conhecer o sistema e entender como ele pode transformar seu negócio. Entre em contato para agendar sua demonstração."
      },
      {
        question: "Como faço para contratar?",
        answer: "É simples! Clique em 'Solicitar proposta' ou fale diretamente com nossa equipe pelo WhatsApp. Vamos entender suas necessidades e apresentar a melhor solução para seu negócio."
      },
      {
        question: "Posso cancelar a qualquer momento?",
        answer: "Sim! Não trabalhamos com fidelidade. Você pode cancelar seu plano a qualquer momento, sem multas ou burocracias."
      }
    ]
  },
  {
    category: "Suporte",
    questions: [
      {
        question: "Como funciona o suporte?",
        answer: "Oferecemos suporte via WhatsApp em horário comercial para todos os planos. Clientes Premium têm acesso a suporte prioritário com atendimento estendido."
      },
      {
        question: "Vocês oferecem treinamento?",
        answer: "Sim! Todos os novos clientes recebem treinamento completo para usar o sistema. Também disponibilizamos materiais de apoio e tutoriais em vídeo."
      },
      {
        question: "O sistema fica fora do ar?",
        answer: "O AgendaAÍ Pro tem 99.9% de uptime garantido. Utilizamos infraestrutura de alta disponibilidade para garantir que seu sistema esteja sempre funcionando quando você e seus clientes precisarem."
      }
    ]
  }
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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
                <span className="text-sm text-primary font-medium">Central de Ajuda</span>
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Perguntas <span className="gradient-text">Frequentes</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground text-balance leading-relaxed">
                Encontre respostas para as dúvidas mais comuns sobre o AgendaAÍ Pro. 
                Não encontrou o que procura? Fale com nossa equipe!
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
                Nossa equipe está pronta para ajudar você a transformar o seu negócio 
                com o AgendaAÍ Pro.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="lg" className="min-h-[48px]" asChild>
                  <a href={getWhatsAppLink(getWhatsAppMessage("faq"))} target="_blank" rel="noopener noreferrer">
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
