import { motion, useScroll, useTransform } from "framer-motion";
import { Scissors, Sparkles, HandMetal, Heart } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Background images for each professional type
import bgBarber from "@/assets/bg-professional-barber.png";
import bgSpa from "@/assets/bg-professional-spa.png";
import bgManicure from "@/assets/bg-professional-manicure.png";
import bgMassage from "@/assets/bg-professional-massage.png";

interface AudienceItem {
  icon: typeof Scissors;
  title: string;
  description: string;
  gradient: string;
  backgroundImage: string;
  opacity?: number;
}

const defaultAudiences: AudienceItem[] = [
  {
    icon: Scissors,
    title: "Barbeiros e Barbearias",
    description:
      "Organize serviços, horários e clientes em um site com a sua marca",
    gradient: "from-cyan-500/20 to-blue-500/20",
    backgroundImage: bgBarber,
    opacity: 40,
  },
  {
    icon: Sparkles,
    title: "Cabeleireiros e Salões",
    description:
      "Apresente seus serviços e escolha as ferramentas para sua operação",
    gradient: "from-purple-500/20 to-pink-500/20",
    backgroundImage: bgSpa,
    opacity: 40,
  },
  {
    icon: HandMetal,
    title: "Manicures e Esteticistas",
    description:
      "Facilite a escolha de serviços e horários pelos seus clientes",
    gradient: "from-pink-500/20 to-rose-500/20",
    backgroundImage: bgManicure,
    opacity: 40,
  },
  {
    icon: Heart,
    title: "Profissionais Autônomos",
    description: "Profissionalize-se e aumente sua credibilidade no mercado",
    gradient: "from-emerald-500/20 to-teal-500/20",
    backgroundImage: bgMassage,
    opacity: 40,
  },
];

const TargetAudienceSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [audiences, setAudiences] = useState(defaultAudiences);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    let active = true;
    const fetchContent = async () => {
      const { data } = await supabase
        .from("landing_content")
        .select("key, value")
        .in("key", ["target_audiences", "target_audiences_v2"]);
      if (!active || !data) return;
      type SavedAudience = {
        title?: string;
        description?: string;
        icon?: string;
        backgroundImage?: string;
        opacity?: number;
      };
      const legacyValue = data.find(
        (item) => item.key === "target_audiences",
      )?.value;
      const currentValue = data.find(
        (item) => item.key === "target_audiences_v2",
      )?.value;
      const legacy = Array.isArray(legacyValue)
        ? (legacyValue as SavedAudience[])
        : [];
      const current = Array.isArray(currentValue)
        ? (currentValue as SavedAudience[])
        : [];
      const iconMap: Record<string, typeof Scissors> = {
        Scissors,
        Sparkles,
        HandMetal,
        Heart,
      };
      setAudiences(
        defaultAudiences.map((fallback, index) => {
          const saved = current[index];
          return {
            ...fallback,
            title: saved?.title || fallback.title,
            description: saved?.description || fallback.description,
            icon: iconMap[saved?.icon] || fallback.icon,
            backgroundImage:
              saved?.backgroundImage ||
              legacy[index]?.backgroundImage ||
              fallback.backgroundImage,
            opacity:
              saved?.opacity ?? legacy[index]?.opacity ?? fallback.opacity,
          };
        }),
      );
    };
    fetchContent();
    return () => {
      active = false;
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, rotateX: -15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 relative overflow-hidden"
    >
      {/* Parallax background elements */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [100, -100]) }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
      />
      <motion.div
        style={{
          y: useTransform(scrollYProgress, [0, 1], [0, -150]),
          rotate: useTransform(scrollYProgress, [0, 1], [0, 45]),
        }}
        className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
      />
      <motion.div
        style={{
          y: useTransform(scrollYProgress, [0, 1], [0, 100]),
          rotate: useTransform(scrollYProgress, [0, 1], [0, -30]),
        }}
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
      />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">
              Feito Para Você
            </span>
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Para quem é o <span className="gradient-text">AgendaAÍ Pro?</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Sistema personalizado para cada tipo de profissional
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {audiences.map((item, index) => (
            <motion.div
              key={item.title}
              variants={cardVariants}
              whileHover={{
                y: -12,
                scale: 1.03,
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
              className="glass-card p-6 card-hover group relative overflow-hidden rounded-xl"
            >
              {/* Background image with transparency */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                style={{
                  backgroundImage: `url(${item.backgroundImage})`,
                  opacity: (item.opacity || 40) / 100,
                }}
              />

              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/70 to-background/50" />

              {/* Animated gradient background on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Shimmer effect on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-30"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, hsla(180, 85%, 50%, 0.2), transparent)",
                }}
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />

              <div className="relative z-10">
                <motion.div
                  className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors backdrop-blur-sm"
                  whileHover={{
                    rotate: [0, -10, 10, -5, 5, 0],
                    transition: { duration: 0.6 },
                  }}
                >
                  <item.icon className="w-7 h-7 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
