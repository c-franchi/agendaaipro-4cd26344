import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

// Background images
import bgTattoo from "@/assets/bg-professional-tattoo.png";
import bgTrainer from "@/assets/bg-professional-trainer.png";

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Barbeiro",
    content: "O sistema mudou a forma como organizo meus atendimentos. Nunca mais tive conflito de horário e recebo antes de atender!",
    rating: 5,
  },
  {
    name: "Ana Paula",
    role: "Esteticista",
    content: "Hoje recebo via Pix automaticamente e ainda vendo produtos junto com o agendamento. Meu faturamento aumentou 40%.",
    rating: 5,
  },
  {
    name: "Marcos Oliveira",
    role: "Dono de Salão",
    content: "Ter um sistema com a nossa marca fez toda diferença. Os clientes veem profissionalismo em cada detalhe.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background professional images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute bottom-0 left-0 w-1/2 h-full bg-cover bg-bottom opacity-[0.2]"
          style={{ backgroundImage: `url(${bgTattoo})` }}
        />
        <div 
          className="absolute bottom-0 right-0 w-1/2 h-full bg-cover bg-bottom opacity-[0.2]"
          style={{ backgroundImage: `url(${bgTrainer})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background" />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">Depoimentos</span>
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos <span className="gradient-text">clientes dizem</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Profissionais que transformaram seus negócios com o AgendaAÍ Pro
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-8 card-hover relative backdrop-blur-lg"
            >
              <Quote className="w-10 h-10 text-primary/20 absolute top-6 right-6" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-foreground mb-6 relative z-10">"{testimonial.content}"</p>

              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
