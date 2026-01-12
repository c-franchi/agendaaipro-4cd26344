import { MessageCircle, Mail, Instagram } from "lucide-react";
import logoDetailed from "@/assets/logo-detailed.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 bg-card/30">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and description */}
          <div className="md:col-span-2">
            <img src={logoDetailed} alt="AgendaAÍ Pro" className="h-20 md:h-24 w-auto mb-4" />
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              O sistema de agenda digital profissional que transforma a gestão do seu negócio. 
              Agendamentos, pagamentos e vendas em um só lugar.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3">
              <li>
                <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#planos" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Planos
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#contato" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/30 mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {currentYear} AgendaAÍ Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
