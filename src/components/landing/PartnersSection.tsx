import { motion } from "framer-motion";

const partners: { name: string; initials: string; url?: string }[] = [
  { name: "Eric Zambonini", initials: "EZ", url: "https://ericzambonini.com.br" },
  { name: "Barbearia Premium", initials: "BP" },
  { name: "Studio Hair", initials: "SH" },
  { name: "Nail Art Center", initials: "NA" },
  { name: "Estética Bella", initials: "EB" },
  { name: "Beauty Pro", initials: "BPr" },
];

const PartnersSection = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden border-y border-border/20">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-card/30 to-background" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-10"
        >
          <p className="text-muted-foreground text-xs sm:text-sm uppercase tracking-wider">
            Confiado por profissionais em todo Brasil
          </p>
        </motion.div>

        {/* Partners logos - Responsive grid */}
        <div className="relative">
          {/* Fade edges - only on larger screens */}
          <div className="absolute left-0 top-0 bottom-0 w-10 md:w-20 bg-gradient-to-r from-background to-transparent z-10 hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-10 md:w-20 bg-gradient-to-l from-background to-transparent z-10 hidden md:block" />
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg bg-card/30 border border-border/20 hover:border-primary/20 transition-all"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xs md:text-sm">{partner.initials}</span>
                </div>
                <span className="text-muted-foreground text-xs md:text-sm font-medium truncate">
                  {partner.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8 md:mt-10 flex items-center justify-center gap-6 sm:gap-8 md:gap-16 text-center"
        >
          {[
            { value: "500+", label: "Parceiros ativos" },
            { value: "98%", label: "Satisfação" },
            { value: "24/7", label: "Suporte" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
