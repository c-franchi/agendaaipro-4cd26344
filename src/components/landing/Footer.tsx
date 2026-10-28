import { Link } from "react-router-dom";
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
            <img
              src={logoDetailed}
              alt="AgendaAÍ Pro - Sistema de Agenda Digital Profissional"
              className="h-20 md:h-24 w-auto mb-4"
            />
            <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
              Seu site com a marca do seu negócio e ferramentas conforme o plano
              contratado. Configuração inicial para você começar e um painel
              para manter suas informações atualizadas.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/5516997813038"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fale conosco pelo WhatsApp"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/agendaaipro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Siga-nos no Instagram"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contato@agendaaipro.com.br"
                aria-label="Envie um e-mail para contato"
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
                <a
                  href="/#funcionalidades"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="/#como-funciona"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Como Funciona
                </a>
              </li>
              <li>
                <a
                  href="/#planos"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
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
                <Link
                  to="/termos"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidade"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <a
                  href="/#contato"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/30 mt-12 pt-8 text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            © {currentYear} AgendaAÍ Pro. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-xs">
            Desenvolvido por{" "}
            <a
              href="https://neitechweb.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              NeiTech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
