import { motion } from "framer-motion";
import { ArrowUpRight, CalendarCheck, Globe, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import caseHero from "@/assets/case-eric-hero.jpg";
import caseServicos from "@/assets/case-eric-servicos.jpg";
import caseMobile from "@/assets/case-eric-mobile.jpg";

const CASE_URL = "https://ericzambonini.com.br";

const highlights = [
  {
    icon: Globe,
    title: "Domínio próprio",
    description: "ericzambonini.com.br com identidade visual exclusiva do profissional.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda online 24 horas",
    description: "O cliente escolhe o serviço e o horário sem precisar de mensagens.",
  },
  {
    icon: Sparkles,
    title: "Catálogo de serviços",
    description: "Cada serviço com duração e valor definidos pelo profissional.",
  },
  {
    icon: Smartphone,
    title: "Pronto para o celular",
    description: "Pode ser instalado na tela inicial como um aplicativo.",
  },
];

const CaseStudySection = () => {
  return (
    <section id="exemplo" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Projeto no ar</span>
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-balance">
            Veja um sistema <span className="gradient-text">já em funcionamento</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Eric Zambonini, profissional de beleza masculina e feminina com mais de 25 anos de
            experiência, recebe agendamentos pelo próprio site — criado com o AgendaAÍ Pro.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-center max-w-6xl mx-auto">
          {/* Screens */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl">
              <img
                src={caseHero}
                alt="Página inicial do site de agendamentos de Eric Zambonini"
                loading="lazy"
                className="w-full h-auto"
              />
            </div>

            {/* Mobile screen floating */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="absolute -bottom-8 -right-2 sm:right-4 w-24 sm:w-32 md:w-40 rounded-2xl overflow-hidden border-2 border-border/60 shadow-2xl hidden sm:block"
            >
              <img
                src={caseMobile}
                alt="Site de agendamentos de Eric Zambonini visto no celular"
                loading="lazy"
                className="w-full h-auto"
              />
            </motion.div>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 space-y-4 mt-10 lg:mt-0"
          >
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="glass-card p-5 rounded-xl flex gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}

            <a
              href={CASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block pt-2"
              aria-label="Abrir o site de Eric Zambonini em uma nova aba"
            >
              <Button variant="hero" size="lg" className="w-full min-h-[48px]">
                Visitar o projeto
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Services screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-20 md:mt-24"
        >
          <p className="text-center text-muted-foreground text-sm md:text-base mb-6">
            A lista de serviços com duração e valores, do jeito que o cliente vê antes de agendar.
          </p>
          <div className="rounded-2xl overflow-hidden border border-border/40 shadow-2xl">
            <img
              src={caseServicos}
              alt="Lista de serviços com duração e valores no site de Eric Zambonini"
              loading="lazy"
              className="w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CaseStudySection;
