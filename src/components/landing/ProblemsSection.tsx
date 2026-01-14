import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

// Background images
import bgMassage from "@/assets/bg-professional-massage.png";
import bgTrainer from "@/assets/bg-professional-trainer.png";

const problems = [
  { problem: "Conflito de horários", solution: "Agenda inteligente sem sobreposição" },
  { problem: "Falta de confirmação de clientes", solution: "Confirmação automática" },
  { problem: "Pagamentos esquecidos", solution: "Cobrança via Pix integrada" },
  { problem: "Perda de vendas de produtos", solution: "Venda vinculada ao agendamento" },
  { problem: "Falta de controle financeiro", solution: "Dashboard completo de vendas" },
  { problem: "Agenda desorganizada", solution: "Visualização clara e profissional" },
];

const ProblemsSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-1/2 h-full bg-cover bg-center opacity-[0.15]"
          style={{ backgroundImage: `url(${bgMassage})` }}
        />
        <div 
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-center opacity-[0.15]"
          style={{ backgroundImage: `url(${bgTrainer})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/70 to-background" />
      </div>
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Problemas que o <span className="gradient-text">sistema resolve</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Chega de dor de cabeça! O AgendaAÍ Pro resolve tudo isso para você.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {problems.map((item, index) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground line-through text-sm mb-2">{item.problem}</p>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="font-medium text-foreground">{item.solution}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
