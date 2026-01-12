import { motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { useState } from "react";

interface VideoSectionProps {
  videoUrl?: string; // YouTube or Vimeo URL
}

const VideoSection = ({ videoUrl }: VideoSectionProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID and determine platform
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

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
          <motion.span 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-primary font-medium">Demonstração</span>
          </motion.span>
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
            {!isPlaying ? (
              <div className="absolute inset-0 bg-gradient-to-br from-card via-secondary to-card flex items-center justify-center">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Play button */}
                <motion.button
                  onClick={() => setIsPlaying(true)}
                  className="relative z-10 group cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!embedUrl}
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
                  {!embedUrl && (
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Vídeo em breve...
                    </p>
                  )}
                </div>
              </div>
            ) : embedUrl ? (
              <div className="absolute inset-0 bg-black">
                <button 
                  onClick={() => setIsPlaying(false)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="AgendaAÍ Pro Demo"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <p className="text-muted-foreground">Vídeo não disponível</p>
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
