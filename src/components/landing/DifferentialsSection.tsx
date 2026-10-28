import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

// Background images
import bgFitness from "@/assets/bg-professional-fitness.png";
import bgSpa from "@/assets/bg-professional-spa.png";

const differentials = [
  "Site personalizado em todos os planos",
  "Logo, cores, contatos e serviços do seu negócio",
  "Estrutura pronta configurada para você",
  "Painel para editar os campos disponíveis",
  "Seus registros separados dos outros negócios",
  "Primeiro ano de domínio .com.br incluído na implementação",
  "Ferramentas conforme o plano contratado",
  "Preparação visual inicial adicional no Premium",
];

const DifferentialsSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-[0.22]"
          style={{ backgroundImage: `url(${bgFitness})` }}
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-[0.22]"
          style={{ backgroundImage: `url(${bgSpa})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Seu negócio, sua apresentação.{" "}
              <span className="gradient-text">É o sistema da sua marca.</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              A personalização faz parte de todos os planos. O que muda são as
              ferramentas e o trabalho visual incluído na entrega.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 md:p-12 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {differentials.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DifferentialsSection;
