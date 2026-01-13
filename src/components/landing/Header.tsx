import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoSimple from "@/assets/logo-simple.png";
import { getWhatsAppLink, getWhatsAppMessage } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL = "neifranchi@gmail.com";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === ADMIN_EMAIL);
    };
    
    checkAdmin();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Planos", href: "#planos" },
    { label: "Contato", href: "#contato" },
    { label: "Minha Assinatura", href: "/minha-assinatura", isLink: true },
  ];

  const whatsappLink = getWhatsAppLink(getWhatsAppMessage("hero"));

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30"
    >
      <div className="container mx-auto flex items-center justify-between py-3">
        <a href="/" className="flex items-center">
          <img src={logoSimple} alt="AgendaAÍ Pro" className="h-12 md:h-14 w-auto" />
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            'isLink' in link && link.isLink ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            )
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <Button variant="heroOutline" size="sm">
              Falar no WhatsApp
            </Button>
          </a>
          <a href="#contato">
            <Button variant="hero" size="sm">
              Começar Agora
            </Button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border/30 bg-card/95 backdrop-blur-xl"
        >
          <nav className="container py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              'isLink' in link && link.isLink ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-primary hover:text-primary/80 transition-colors py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}
            <div className="flex flex-col gap-3 pt-4 border-t border-border/30">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <Button variant="heroOutline" className="w-full">
                  Falar no WhatsApp
                </Button>
              </a>
              <a href="#contato">
                <Button variant="hero" className="w-full">
                  Começar Agora
                </Button>
              </a>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
