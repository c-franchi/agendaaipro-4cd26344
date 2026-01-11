import { motion } from "framer-motion";
import { Scissors, Sparkles, HandMetal, Heart } from "lucide-react";

const audiences = [
  {
    icon: Scissors,
    title: "Barbeiros e Barbearias",
    description: "Gerencie cortes, barbas e pacotes com agenda organizada",
  },
  {
    icon: Sparkles,
    title: "Cabeleireiros e Salões",
    description: "Controle serviços, profissionais e horários em um só lugar",
  },
  {
    icon: HandMetal,
    title: "Manicures e Esteticistas",
    description: "Agende procedimentos, venda produtos e receba via Pix",
  },
  {
    icon: Heart,
    title: "Profissionais Autônomos",
    description: "Tenha seu sistema profissional com sua marca",
  },
];

const TargetAudienceSection = () => {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Para quem é o <span className="gradient-text">AgendaAÍ Pro?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sistema personalizado para cada tipo de negócio
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 card-hover group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
