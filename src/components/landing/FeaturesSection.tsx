import { motion } from "framer-motion";
import { Calendar, CreditCard, ShoppingCart, BarChart3, MessageSquare, Palette } from "lucide-react";

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
  return (
    <section id="funcionalidades" className="py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Funcionalidades <span className="gradient-text">principais</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tudo que você precisa para profissionalizar seus atendimentos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 card-hover group relative overflow-hidden"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
