import { Palette, Settings, UserRound } from "lucide-react";

const responsibilities = [
  {
    icon: UserRound,
    title: "Você mantém seu negócio atualizado",
    text: "Envie logo, imagens e textos prontos. Depois da entrega, atualize serviços, preços, horários e os campos disponíveis no painel.",
  },
  {
    icon: Settings,
    title: "Nós configuramos em todos os planos",
    text: "Aplicamos sua marca à estrutura, configuramos os recursos contratados, testamos o ambiente e orientamos você no primeiro acesso.",
  },
  {
    icon: Palette,
    title: "No Premium, preparamos o visual inicial",
    text: "Tratamos até 10 imagens, organizamos até 10 itens do portfólio e criamos 1 vídeo curto, com 2 rodadas de revisão. Esse trabalho é inicial; novos conteúdos são orçados à parte.",
  },
];

const ResponsibilitiesSection = () => (
  <section className="py-20 bg-primary/5">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Quem faz <span className="gradient-text">o quê?</span>
        </h2>
        <p className="text-muted-foreground">
          Uma entrega com responsabilidades claras, do primeiro contato à rotina
          de uso.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {responsibilities.map((item) => (
          <article key={item.title} className="glass-card p-6">
            <item.icon className="w-7 h-7 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.text}
            </p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
export default ResponsibilitiesSection;
