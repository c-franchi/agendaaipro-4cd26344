# Premium multiprofissional — ativação comercial controlada

**Estado: preparação.** O código comercial está atrás de `PREMIUM_TEAM_ROLLOUT.enabled = false` em `src/lib/premium-team-rollout.ts`. Não é anúncio, contratação ou migração de clientes atuais.

## Proposta

- Premium: **titular + 1 profissional adicional** no mesmo estabelecimento, com login individual, agenda de cada pessoa, serviços/horários próprios, estoque, caixa, chat e portfólio isolados. O titular tem visão de toda a operação.
- Plano Agenda e Gestão: **1 profissional** por instalação.
- Não há assinatura separada para o segundo profissional. Não prometer mais de dois assentos sem novo plano/cobrança acordada.
- Preservar mensalidade e implementação em vigor; novos benefícios não autorizam mudança automática de preço ou de contrato já aceito.

## Dependências obrigatórias para liberar

1. Revisar e integrar a PR de sistema-base `c-franchi/Agendaaipro#5`; executar build, testes SQL/RLS com JWT de duas pessoas, concorrência de horários, transações de estoque, baixa idempotente e reversões. Nesta etapa nenhuma alteração de pagamentos é necessária.
2. Confirmar uma única instalação por cliente no Supabase do site profissional e executar migrations em ordem com backup. Inicializar a empresa via painel do titular (novo endpoint `initialize_business`).
3. Implementar **provisionamento servidor-servidor** do entitlement conforme pedido/assinatura verificados: gravar `business_entitlements(plan_key='premium',seat_limit=2,status='active',valid_until=...)` apenas por backend confiável/serviço administrativo. Nunca disponibilizar `service_role` no frontend nem confiar em `localStorage`, nome do plano enviado pelo usuário ou apenas e-mail. Status da assinatura e data de expiração devem bloquear novos convites e alterações premium quando necessário, preservando históricos.
4. Versionar **novo contrato** (por exemplo, posterior ao `2026-11-02-v2`) que indique capacidade de dois profissionais no Premium, dados consolidados do titular, limite de assentos, responsabilidade de permissões, regras de revogação/transferência e escopo do suporte. Não modificar aceites históricos. Atualizar o template persistido `commerce_contract_template` e conferir que o checkout exibe a versão **real** vigente, antes do aceite e pagamento.
5. Atualizar descrição comercial, comparação e FAQ com a chave `PREMIUM_TEAM_ROLLOUT.enabled=true` **somente depois** de (1)–(4), junto de homologação de checkout e fluxo de boas-vindas.
6. Confirmar ponta a ponta: dois e-mails, convites 72 horas, agendas 14:00 simultâneas, tentativa de acessar financeiro do colega negada na API, baixa de material uma vez, histórico preservado após revogação.

## Contrato — texto proposto para revisão (não vigente)

> No plano Premium, a instalação inclui o acesso do titular e de um profissional adicional indicado por ele, totalizando até dois profissionais ativos. Cada profissional utiliza conta individual, com agenda, serviços, clientes dos seus atendimentos e registros operacionais próprios. O titular administra os convites e possui acesso consolidado às informações do estabelecimento. O profissional convidado não altera dados, configurações de assinatura ou registros exclusivos do titular ou de outro profissional. A remoção de acesso não apaga registros históricos e poderá exigir transferência ou cancelamento de agendamentos futuros. A eventual inclusão de outras pessoas, serviços externos e produção adicional de conteúdo dependerá de proposta própria.

**Revisão jurídica necessária** antes do uso comercial, especialmente porque textos aceitos anteriormente dizem “uma agenda por instalação”.

## Preços e pagamentos

- Nenhum Stripe price ID, valor mensal, implementação, voucher, checkout ou assinatura histórica foi alterado neste PR.
- A integração de entitlement entre o site comercial e a instalação de cada negócio ainda é **pendente**, não criar automaticamente contas com dois assentos a partir de labels do frontend.
- Se o contrato vigente divergir das telas, **não habilitar o novo benefício no checkout**.

## Referências

- App-base: `https://github.com/c-franchi/Agendaaipro/pull/5`
- Tarefa comercial: `https://github.com/c-franchi/agendaaipro-4cd26344/issues/24`
