import {catalog} from "../../supabase/functions/_shared/commerce";
export const APP_URL = "https://app.agendaaipro.com.br";

// Historical keys are preserved for existing customer records.
// Old CMS prices and Stripe IDs do not define the new commercial offer.
export const PLANS = {
  essencial: {
    name: "Agenda",
    price: catalog.essencial.monthlyCents / 100,
    setupPrice: catalog.essencial.setupCents / 100,
    description: "Para organizar seus atendimentos",
    features: [
      "Site com sua logo, cores e informações",
      "Agenda online e cadastro de clientes",
      "Serviços, preços e duração editáveis",
      "Horários, bloqueios e agendamentos manuais",
      "Configuração inicial e orientação de uso",
    ],
    plannedFeatures: [] as string[],
    popular: false,
  },
  pro: {
    name: "Gestão",
    price: catalog.pro.monthlyCents / 100,
    setupPrice: catalog.pro.setupCents / 100,
    description: "Para acompanhar a operação do negócio",
    features: [
      "Tudo do Agenda",
      "Site personalizado e painel de edição",
      "Configuração dos recursos contratados",
    ],
    plannedFeatures: [
      "Catálogo, vendas e estoque de produtos",
      "Entradas, saídas e fluxo de caixa",
      "Relatórios de atendimentos e vendas",
    ],
    popular: true,
  },
  premium: {
    name: "Premium",
    price: catalog.premium.monthlyCents / 100,
    setupPrice: catalog.premium.setupCents / 100,
    description: "Mais ferramentas e preparação visual inicial",
    features: [
      "Tudo do Gestão",
      "Preparação visual na entrega inicial",
      "Até 10 imagens e 10 itens de portfólio",
      "1 vídeo curto e 2 rodadas de revisão",
    ],
    plannedFeatures: [
      "Insumos e consumo de materiais por serviço",
      "Baixa de insumos ao concluir o atendimento",
      "Custos registrados e margem estimada",
    ],
    popular: false,
  },
};

export type PlanKey = keyof typeof PLANS;
export const PLAN_KEYS = Object.keys(PLANS) as PlanKey[];
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export const PREMIUM_CONTENT_NOTE =
  "A mensalidade remunera as ferramentas do sistema, hospedagem, manutenção técnica e suporte de uso. A preparação de imagens, portfólio e vídeo acontece somente na entrega inicial. Não há criação mensal de conteúdo incluída.";
export const DELIVERY_NOTE =
  "Prazo estimado de 15 a 20 dias úteis após a confirmação da contratação, pagamento da implementação e recebimento de todos os materiais. Recursos em preparação terão disponibilidade e prazo confirmados antes de qualquer cobrança.";
export const DEFAULT_HERO = {
  title: "Seu negócio com site próprio, domínio e agendamento online",
  subtitle:
    "Receba um site com sua logo, cores e serviços, conectado ao painel de agendamento. Seus clientes agendam pelo endereço do seu negócio, e você organiza os atendimentos no celular ou no computador.",
  cta_primary: "Conhecer os planos",
  cta_secondary: "Falar sobre meu negócio",
};

export const OFFER_FAQS = [
  {question:"Preciso baixar um aplicativo para usar?",answer:"Você e seus clientes podem acessar pelo navegador. O sistema é um site com recursos de aplicativo (PWA), que pode ser instalado em dispositivos e navegadores compatíveis, sem depender de uma loja de aplicativos. A instalação é opcional e não significa funcionamento completo sem internet."},
  {question:"O que diferencia esta oferta de um aplicativo de agenda?",answer:"A oferta combina um site com a identidade e o domínio do seu negócio, agendamento para seus clientes e um painel para o profissional. Alguns aplicativos também oferecem esses recursos; compare o conjunto, a configuração inicial, o suporte e os módulos efetivamente contratados."},
  {question:"O sistema é desenvolvido do zero exclusivamente para mim?",answer:"Utilizamos uma estrutura pronta, configurada com sua marca, dados e serviços. A contratação é do acesso à plataforma com personalização inicial; não implica compra do código-fonte ou desenvolvimento exclusivo. Você edita os campos disponíveis no painel. Mudanças de estrutura e novas funções exigem avaliação e orçamento."},
  {
    question: "Todos os planos incluem um site personalizado?",
    answer:
      "Sim. Configuramos a estrutura com sua logo, cores, contatos, informações e serviços em todos os planos. Você fornece os materiais prontos e recebe seu próprio acesso, com os registros do seu negócio separados. As ferramentas disponíveis variam conforme o plano.",
  },
  {
    question: "O que posso editar sozinho?",
    answer:
      "Você pode atualizar serviços, preços, duração, horários e os campos de informações e conteúdos disponíveis no painel. Alterações na estrutura do site ou novas funções precisam de avaliação e orçamento.",
  },
  {
    question: "Quanto custa e o que pago na contratação?",
    answer:
      PLAN_KEYS.map(
        (key) =>
          `${PLANS[key].name}: ${formatCurrency(PLANS[key].price)}/mês e ${formatCurrency(PLANS[key].setupPrice)} de implementação.`,
      ).join(" ") +
      " A implementação é única. A mensalidade começa quando o sistema for disponibilizado para uso. A contratação é assistida: confirmamos escopo, limites e disponibilidade antes da cobrança.",
  },
  {
    question: "O Premium inclui conteúdo novo todo mês?",
    answer:
      PREMIUM_CONTENT_NOTE +
      " Na entrega inicial estão previstos até 10 imagens fornecidas pelo cliente, organização de até 10 itens do portfólio, 1 vídeo curto e 2 rodadas de revisão. Novas artes, vídeos, criação de logo e alterações posteriores feitas pela equipe são orçados separadamente.",
  },
  {
    question: "Como funcionam estoque e consumo de materiais?",
    answer:
      "O Gestão prevê estoque dos produtos vendidos, com entradas, saídas e alertas. O Premium também prevê insumos consumidos nos serviços e margem estimada a partir dos custos registrados. Esses módulos estão em preparação e precisam ser implementados e validados no sistema antes da contratação com esses recursos.",
  },
  {
    question: "O domínio está incluído?",
    answer:
      "A implementação inclui o primeiro ano de um domínio .com.br, sujeito à disponibilidade do nome. A renovação após o primeiro ano é cobrada separadamente, com valor informado previamente.",
  },
  { question: "Quando recebo meu sistema?", answer: DELIVERY_NOTE },
  {
    question: "O que a mensalidade inclui e o que é cobrado à parte?",
    answer:
      "Inclui as ferramentas contratadas, hospedagem, manutenção técnica e suporte de uso. Quantidade de profissionais, armazenamento e canais e horários de suporte serão definidos na proposta antes do pagamento. Taxas dos meios de pagamento, mensagens pagas, serviços externos e produção adicional de conteúdo não estão incluídos.",
  },
  {
    question: "Posso conhecer o sistema antes de contratar?",
    answer:
      "Sim. Veja o exemplo do Eric Zambonini e solicite uma demonstração. O exemplo mostra uma aplicação da estrutura; seu site recebe sua própria marca e as funções contratadas. A solicitação pelo site não gera cobrança nem ativa uma assinatura automaticamente.",
  },
  {
    question: "Como funcionam pagamentos e mensagens automáticas?",
    answer:
      "A disponibilidade de Pix integrado, confirmações e mensagens automáticas depende das integrações configuradas no seu sistema. Confirmamos as funções e os custos externos na proposta, antes de contratar. Não são recursos automaticamente incluídos em todos os planos.",
  },
  {
    question: "Como funciona o cancelamento?",
    answer:
      "Você pode solicitar o cancelamento pelo atendimento ou gerenciar uma assinatura existente na sua conta. As condições de encerramento, acesso aos dados e implementação serão apresentadas na proposta antes do pagamento.",
  },
];
