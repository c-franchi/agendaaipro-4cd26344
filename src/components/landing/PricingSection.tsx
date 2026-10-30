import {usePromotions,displayedOffer} from '@/lib/offers';
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import {
  PLANS,
  PLAN_KEYS,
  PlanKey,
  formatCurrency,
  PREMIUM_CONTENT_NOTE,
  DELIVERY_NOTE,
} from "@/lib/constants";

import { supabase } from "@/integrations/supabase/client";
import bgBarber from "@/assets/bg-professional-barber.png";
import bgManicure from "@/assets/bg-professional-manicure.png";
import bgMassage from "@/assets/bg-professional-massage.png";

const defaultImages: Record<PlanKey, string> = {
  essencial: bgBarber,
  pro: bgManicure,
  premium: bgMassage,
};
const comparison = [
  [
    "Site com sua marca e configuração inicial",
    "Incluído",
    "Incluído",
    "Incluído",
  ],
  [
    "Agenda, clientes, serviços e horários editáveis",
    "Incluído",
    "Incluído",
    "Incluído",
  ],
  ["Catálogo, vendas e estoque de produtos", "—", "Incluído", "Incluído"],
  ["Resumo financeiro mensal dos atendimentos", "—", "Incluído", "Incluído"],
  ["Receitas, despesas e fluxo de caixa", "—", "Incluído", "Incluído"],
  ["Insumos por serviço e margem estimada", "—", "—", "Incluído"],
  [
    "Preparação de imagens, portfólio e vídeo",
    "Avulso",
    "Avulso",
    "Entrega inicial",
  ],
];

const PricingSection = () => {
  const promotions=usePromotions();
  const [images, setImages] = useState(defaultImages);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  useEffect(() => {
    let active = true;
    supabase
      .from("landing_content")
      .select("key, value")
      .in("key", ["pricing_plans", "pricing_images_v2"])
      .then(({ data }) => {
        if (!active || !data) return;
        const legacy = data.find((item) => item.key === "pricing_plans")
          ?.value as Record<string, { bg_image?: string }> | undefined;
        const current = data.find((item) => item.key === "pricing_images_v2")
          ?.value as Record<string, string> | undefined;
        setImages(
          Object.fromEntries(
            PLAN_KEYS.map((key) => [
              key,
              current?.[key] !== undefined
                ? current[key] || defaultImages[key]
                : legacy?.[key]?.bg_image || defaultImages[key],
            ]),
          ) as Record<PlanKey, string>,
        );
      });
    return () => {
      active = false;
    };
  }, []);
  // Resume only the plan choice. Never reuse a browser-stored payment amount.
  useEffect(() => {
    const stored = localStorage.getItem("auto_open_checkout");
    localStorage.removeItem("auto_open_checkout");
    if (!stored) return;
    try {
      const key = JSON.parse(stored).planType;
      if (PLAN_KEYS.includes(key)) setSelectedPlan(key);
    } catch {
      /* An invalid previous selection can be discarded. */
    }
  }, []);

  return (
    <section id="planos" className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      <div className="container relative z-10">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className="inline-block text-sm text-primary font-medium bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-5">
            Planos e valores
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sua marca em todos os planos.
            <br />
            <span className="gradient-text">Escolha suas ferramentas.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Configuramos seu site com logo, cores, contatos e serviços. Depois,
            você administra os campos disponíveis no painel. A implementação é
            paga uma vez; a mensalidade mantém o sistema e seus recursos.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {PLAN_KEYS.map((key, index) => {
            const plan = PLANS[key];
            const offer=displayedOffer(promotions,key);
            return (
              <motion.article
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`glass-card p-6 md:p-8 relative flex flex-col ${plan.popular ? "border-primary/60" : ""}`}
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--card) / .95), hsl(var(--card) / .95)), url("${images[key]}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 text-xs text-primary bg-card border border-primary/40 rounded-full px-3 py-1">
                    Agenda + gestão
                  </span>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 min-h-10">
                  {plan.description}
                </p>
                {offer.promotion&&<p className="mt-3 text-sm text-primary">{offer.promotion.title}{offer.promotion.ends_at?` · até ${new Date(offer.promotion.ends_at).toLocaleString('pt-BR')}`:''}</p>}
                <p className="mt-5">
                  {offer.monthly<plan.price&&<del className="block text-sm text-muted-foreground">{formatCurrency(plan.price)}/mês</del>}
                  <span className="text-4xl font-bold gradient-text">
                    {formatCurrency(offer.monthly)}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </p>
                <p className="mt-3 text-sm border-y border-border/50 py-3">
                  {offer.setup<plan.setupPrice&&<del className="mr-2 text-muted-foreground">{formatCurrency(plan.setupPrice)}</del>}<strong>{formatCurrency(offer.setup)}</strong> de
                  implementação única
                </p>
                <ul className="space-y-3 my-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <p className="text-xs text-muted-foreground mb-4">
                    {key === "premium"
                      ? "Imagens e vídeo somente na entrega inicial. A mensalidade é pelas ferramentas, sem conteúdo novo todo mês."
                      : "Você fornece logo, imagens e textos prontos; nós configuramos seu site."}
                  </p>
                  <Button
                    variant={plan.popular ? "hero" : "heroOutline"}
                    className="w-full"
                    onClick={() => setSelectedPlan(key)}
                  >
                    Quero o {plan.name}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
        <p className="max-w-4xl mx-auto text-sm text-muted-foreground mt-6 text-center">
          O fluxo de caixa considera receitas e despesas registradas. No Premium,
          a margem estimada do serviço desconta os materiais consumidos;
          não equivale a lucro líquido. A baixa acontece ao concluir o atendimento.
        </p>
        <div
          className="max-w-6xl mx-auto mt-12 overflow-x-auto rounded-xl border border-border/50"
          tabIndex={0}
          role="region"
          aria-label="Comparação dos planos, role horizontalmente para ver todas as colunas"
        >
          <table className="w-full min-w-[640px] text-sm text-left">
            <caption className="text-left p-5 font-semibold text-lg">
              Compare o que você recebe
            </caption>
            <thead className="bg-secondary/50">
              <tr>
                <th scope="col" className="p-4">
                  Recurso
                </th>
                {PLAN_KEYS.map((key) => (
                  <th scope="col" className="p-4" key={key}>
                    {PLANS[key].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map(([label, ...values]) => (
                <tr key={label} className="border-t border-border/40">
                  <th scope="row" className="p-4 font-normal">
                    {label}
                  </th>
                  {values.map((value, i) => (
                    <td key={i} className="p-4 text-muted-foreground">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="max-w-6xl mx-auto mt-10 grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <Palette className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-semibold text-xl mb-3">
              Premium: preparação visual inicial
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Até 10 imagens fornecidas por você, organização de até 10 itens do
              portfólio, 1 vídeo curto e 2 rodadas de revisão. Criação de logo
              nova e produção adicional são serviços avulsos.
            </p>
            <p className="text-sm mt-4 leading-relaxed">
              {PREMIUM_CONTENT_NOTE}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="font-semibold text-xl mb-3">
              Uma cobrança sem dúvidas
            </h3>
            <ul className="text-sm text-muted-foreground space-y-3">
              <li>
                <strong className="text-foreground">Implementação:</strong>{" "}
                configuração, orientação inicial e primeiro ano de domínio
                .com.br, sujeito à disponibilidade.
              </li>
              <li>
                <strong className="text-foreground">Mensalidade:</strong> começa
                após a aprovação da entrega. Inclui ferramentas contratadas,
                hospedagem, manutenção técnica e suporte de uso.
              </li>
              <li>
                <strong className="text-foreground">À parte:</strong> renovação
                do domínio, taxas de pagamento, mensagens pagas, serviços
                externos e conteúdo adicional.
              </li>
              <li>
                Cada instalação possui uma agenda de atendimento. Necessidades fora da estrutura e dos módulos do plano são avaliadas separadamente.
              </li>
            </ul>
          </div>
        </div>
        <p className="max-w-4xl mx-auto mt-6 text-sm text-muted-foreground text-center">
          {DELIVERY_NOTE}
        </p>
      </div>
      {selectedPlan && (
        <CheckoutModal
          key={selectedPlan}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedPlan(null);
          }}
          planType={selectedPlan}
        />
      )}
    </section>
  );
};
export default PricingSection;
