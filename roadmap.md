# Checkout commerce v3 — vouchers

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
