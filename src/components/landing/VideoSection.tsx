import { motion } from "framer-motion";
import { Play, PlayCircle } from "lucide-react";
import { useState } from "react";

const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="video" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Veja o <span className="gradient-text">AgendaAÍ Pro</span> em ação
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Assista uma demonstração rápida de como o sistema funciona e como pode transformar seu negócio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative aspect-video rounded-2xl overflow-hidden glass-card border border-border/50 shadow-2xl shadow-primary/10">
            {/* Video placeholder - replace src with actual video URL */}
            {!isPlaying ? (
              <div className="absolute inset-0 bg-gradient-to-br from-card via-secondary to-card flex items-center justify-center">
                {/* Placeholder content */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Play button */}
                <motion.button
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 group-hover:bg-primary/30 transition-colors" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground ml-1" fill="currentColor" />
                  </div>
                </motion.button>

                {/* Text overlay */}
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <p className="text-sm text-muted-foreground mb-2">Demonstração</p>
                  <h3 className="text-lg md:text-xl font-semibold">Como usar o AgendaAÍ Pro</h3>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                {/* Replace this with actual video embed */}
                <div className="text-center p-8">
                  <PlayCircle className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground">
                    Espaço reservado para o vídeo demonstrativo.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cole o link do YouTube ou Vimeo aqui
                  </p>
                  <button 
                    onClick={() => setIsPlaying(false)}
                    className="mt-4 text-primary hover:underline text-sm"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video features */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Fácil de usar", desc: "Interface intuitiva" },
              { label: "100% Online", desc: "Acesse de qualquer lugar" },
              { label: "Suporte 24h", desc: "Sempre disponível" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <p className="font-semibold text-sm md:text-base">{item.label}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
