import { motion } from "framer-motion";

const partners = [
  { name: "Barbearia Premium", initials: "BP" },
  { name: "Studio Hair", initials: "SH" },
  { name: "Nail Art Center", initials: "NA" },
  { name: "Estética Bella", initials: "EB" },
  { name: "Salão VIP", initials: "SV" },
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
          className="text-center mb-10"
        >
          <p className="text-muted-foreground text-sm uppercase tracking-wider">
            Confiado por profissionais em todo Brasil
          </p>
        </motion.div>

        {/* Partners logos */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card/30 border border-border/20 hover:border-primary/20 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{partner.initials}</span>
                </div>
                <span className="text-muted-foreground text-sm font-medium whitespace-nowrap">
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
          className="mt-10 flex items-center justify-center gap-8 md:gap-16 text-center"
        >
          {[
            { value: "500+", label: "Parceiros ativos" },
            { value: "98%", label: "Satisfação" },
            { value: "24/7", label: "Suporte" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-xl md:text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PartnersSection;
