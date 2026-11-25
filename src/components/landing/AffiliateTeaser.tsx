import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";

const AffiliateTeaser = () => (
  <section className="container py-8">
    <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center gap-3 rounded-xl border border-border/40 bg-card/40 px-5 py-4 text-sm text-muted-foreground">
      <Handshake className="h-5 w-5 text-primary shrink-0" />
      <p className="flex-1 text-center sm:text-left">Indique o AgendaAÍ Pro e ganhe comissão em cada venda e mensalidade.</p>
      <Link to="/afiliado" className="text-primary font-medium hover:underline whitespace-nowrap">Programa de afiliados →</Link>
    </div>
  </section>
);
export default AffiliateTeaser;
