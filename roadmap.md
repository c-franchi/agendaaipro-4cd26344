# Checkout commerce v3 — vouchers

- [x] Corrigir implementação gratuita: Checkout de cadastro de cartão, autorização verificada no webhook, retomada segura de sessões abertas antigas, testes de handlers/SQL descartável e funções publicadas; status 200, identidade inválida 401 e webhook sem assinatura 400. Nenhum pedido real alterado pela validação.
- [ ] Validar conclusão com cartão real pelo comprador — bloqueado: testes não podem criar transações ou clientes reais; o comprador precisa retomar Meus pedidos. Textos novos dependem da publicação do frontend pelo proprietário.

- [x] Melhorar leitura e organização dos pedidos no celular e conferir a pendência do pedido informado, sem alterar pagamentos: Stripe aberta com total zero; testes visuais fictícios em 360/1280 px e 9 testes aprovados. Sessão administrativa real indisponível.

- [x] Inspect existing checkout, voucher administration, legacy endpoints, schema and test harness.
- [ ] Define explicit legacy scope/duration compatibility and reviewed voucher configuration.
- [ ] Implement authoritative quotes, immutable snapshots and atomic reservations/consumption/release.
- [ ] Integrate setup and recurring Stripe discounts and net-value/contract webhook checks.
- [ ] Remove legacy free-subscription bypass and insecure voucher validation/client writes.
- [ ] Add independent voucher fields and financial summaries without redesigning existing views.
- [ ] Execute migration/handler/concurrency/replay/discount tests and password-recovery regressions.
- [ ] Apply migration, confirm deployed functions, inspect grants/RLS and disabled flags.
- [ ] Report source SHA, changed files, verification results and remaining limitations.
- [x] Afiliados: cadastro, link ref, comissão 15% implementação + 5% mensalidades enquanto pagar
- [x] Liberar acesso individual de afiliados: isolamento e reversão testados em PostgreSQL descartável; SQL autorizado aplicado byte a byte; políticas e recusa anônima verificadas, sem pedidos ou comissões de teste em produção.
- [ ] Validar a área com o primeiro afiliado real após publicação — bloqueado: nenhum afiliado cadastrado e nenhuma sessão do proprietário disponível para verificar o fluxo autenticado.
