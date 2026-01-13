import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroMockup from "@/assets/hero-mockup.png";
import bgBarber from "@/assets/bg-professional-barber.png";
import bgManicure from "@/assets/bg-professional-manicure.png";
import bgMassage from "@/assets/bg-professional-massage.png";
import bgTrainer from "@/assets/bg-professional-trainer.png";
import { useRef, useState, useEffect } from "react";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

interface HeroContent {
  title: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  bg_image?: string;
  mockup_image?: string;
}

const defaultHeroContent: HeroContent = {
  title: "Seu atendimento, seus pagamentos e suas vendas",
  subtitle: "O AgendaAÍ Pro é o sistema de agenda digital da sua marca, com pagamentos via Pix e venda de produtos integrada.",
  cta_primary: "Quero minha agenda profissional",
  cta_secondary: "Falar com um especialista",
};

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [heroContent, setHeroContent] = useState<HeroContent>(defaultHeroContent);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_content")
          .select("value")
          .eq("key", "hero_content")
          .single();
        
        if (!error && data?.value) {
          setHeroContent({ ...defaultHeroContent, ...(data.value as unknown as HeroContent) });
        }
      } catch (error) {
        console.error("Error fetching hero content:", error);
      }
    };
    
    fetchHeroContent();
  }, []);

  const mockupSrc = heroContent.mockup_image || heroMockup;

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-hero-glow" />
      
      {/* Background professional images with transparency */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[10%] left-[2%] opacity-[0.18] hidden lg:block"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        >
          <img 
            src={bgBarber} 
            alt="" 
            className="w-40 xl:w-52 h-auto rounded-2xl"
          />
        </motion.div>
        <motion.div 
          className="absolute bottom-[15%] left-[5%] opacity-[0.15] hidden lg:block"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        >
          <img 
            src={bgManicure} 
            alt="" 
            className="w-36 xl:w-44 h-auto rounded-2xl"
          />
        </motion.div>
        <motion.div 
          className="absolute top-[20%] right-[2%] opacity-[0.18] hidden lg:block"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, delay: 0.5 }}
        >
          <img 
            src={bgMassage} 
            alt="" 
            className="w-36 xl:w-48 h-auto rounded-2xl"
          />
        </motion.div>
        <motion.div 
          className="absolute bottom-[20%] right-[3%] opacity-[0.15] hidden lg:block"
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
        >
          <img 
            src={bgTrainer} 
            alt="" 
            className="w-32 xl:w-40 h-auto rounded-2xl"
          />
        </motion.div>
      </div>
      
      {/* Floating orbs with parallax */}
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 100]) }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl floating-element" 
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 50]) }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl floating-element-delayed" 
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }}
        className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/5 rounded-full blur-2xl" 
      />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <motion.div style={{ opacity, scale }} className="container relative z-10 py-4 md:py-16">
        <div className="grid lg:grid-cols-2 gap-6 md:gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-4 md:space-y-0">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary animate-pulse" />
              <span className="text-xs md:text-sm text-primary font-medium">Sistema Profissional de Agenda Digital</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-4 md:mb-6"
            >
              {heroContent.title}{" "}
              <motion.span 
                className="gradient-text inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                em um só sistema.
              </motion.span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-sm md:text-base lg:text-lg text-muted-foreground mb-4 md:mb-8 max-w-xl mx-auto lg:mx-0 text-balance"
            >
              {heroContent.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 md:gap-4 mb-3 md:mb-4"
            >
              <motion.a
                href="#contato"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Button variant="hero" size="lg" className="w-full sm:w-auto group text-sm md:text-base">
                  {heroContent.cta_primary}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </motion.a>
              <motion.a
                href={getWhatsAppLink(getWhatsAppMessage("hero"))}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto"
              >
                <Button variant="heroOutline" size="lg" className="w-full sm:w-auto group text-sm md:text-base">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                  {heroContent.cta_secondary}
                </Button>
              </motion.a>
            </motion.div>
            
            {/* Urgency phrase */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-xs md:text-sm text-primary/80 mb-4 md:mb-8 text-center lg:text-left"
            >
              ⚡ Configuração rápida. Comece a usar em poucos dias.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-3 gap-2 md:gap-6 pt-4 md:pt-8 border-t border-border/30"
            >
              {[
                { value: "100%", label: "Sistema personalizado" },
                { value: "24/7", label: "Agendamentos online" },
                { value: "99.9%", label: "Infraestrutura estável" },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label} 
                  className="text-center lg:text-left"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-0.5 md:mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" as const, stiffness: 50 }}
            className="relative"
          >
            <div className="relative max-w-[280px] sm:max-w-sm md:max-w-md mx-auto lg:max-w-none">
              {/* Multiple glow layers */}
              <motion.div 
                className="absolute inset-0 bg-primary/20 blur-3xl rounded-3xl scale-90"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                  scale: [0.85, 0.9, 0.85]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.img 
                src={mockupSrc} 
                alt="AgendaAÍ Pro Dashboard - Sistema de Agendamento Profissional" 
                className="relative z-10 w-full h-auto rounded-2xl shadow-2xl object-contain"
                style={{ y }}
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <span className="text-xs text-muted-foreground">Role para explorar</span>
        <motion.div 
          className="w-6 h-10 rounded-full border-2 border-primary/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div 
            className="w-1.5 h-3 bg-primary rounded-full"
            animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
