/**
 * PREPARAÇÃO COMERCIAL: NÃO ativar antes de:
 * 1) merge da base c-franchi/Agendaaipro#5 + testes RLS/agenda/estoque
 * 2) deploy da instalação e provisionamento backend do plano Premium (2 assentos)
 * 3) novo contrato versionado/aceite correto no checkout.
 *
 * Esta constante intencionalmente desativa a promessa comercial até a homologação.
 */
export const PREMIUM_TEAM_ROLLOUT = {
  enabled: false,
  maxProfessionals: 2,
  benefit: "Dois profissionais no mesmo negócio: titular + um convidado com conta, agenda e gestão próprias",
  comparison: ["Profissionais por estabelecimento", "1", "1", "2"],
  faq: {
    question: "Posso trabalhar com outra pessoa no mesmo negócio?",
    answer: "No Premium, após a habilitação desse recurso, o titular poderá convidar mais um profissional. Cada pessoa terá seus próprios horários, agendamentos, serviços e dados financeiros, com acesso independente. O titular terá visão consolidada. O plano inclui dois profissionais no total, sem uma segunda assinatura.",
  },
} as const;
