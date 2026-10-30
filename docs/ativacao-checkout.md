# Ativação do pagamento AgendaAÍ

Projeto Lovable: 010c13fb-66ac-402e-8b8b-d9a589c2d67d. Backend: paajzwvuccvdveejdown.
Conta Stripe esperada: acct_1SonvKENKykBJoOz. Verificação desta sessão: charges_enabled=true, payouts_enabled=true, sem disabled_reason. Nenhuma cobrança foi iniciada.

## Estado

Checkout retornou enabled=false e recurringEnabled=false. Não informa voucherVersion, portanto a função publicada não é a versão atual dos vouchers. A conexão Supabase desta sessão não autoriza deploy no projeto Lovable. O usuário proibiu consumo de créditos de edição Lovable; o agente Lovable não foi acionado.

## Publicação necessária, sem reescrever o sistema

1. Sincronizar main e publicar os arquivos atuais de commerce-orders, create-checkout, validate-voucher, stripe-commerce-webhook e create-free-subscription, com seus imports _shared. Preservar as configurações de autenticação de supabase/config.toml. O webhook valida Stripe-Signature; as funções de usuário validam identidade no código.
2. Preservar os segredos existentes, sem imprimi-los. Confirmar STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET e STRIPE_EXPECTED_ACCOUNT_ID correspondem à conta esperada. Não solicitar chaves pelo chat.
3. Confirmar webhook de produção aponta para /functions/v1/stripe-commerce-webhook e inclui checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, charge.refunded, customer.subscription.updated, customer.subscription.deleted, invoice.paid e invoice.payment_failed. Não remover eventos existentes sem revisar dependências. Validar entrega assinada real; não afirmar integração validada somente com chamada sem assinatura ou HMAC sintético.
4. Validar funções e só então configurar STRIPE_CHECKOUT_ENABLED=true e STRIPE_RECURRING_ENABLED=true. Não criar cobrança, assinatura ou pagamento real de teste. Não alterar pedidos existentes nem liberar plataforma sem confirmação de pagamento.
5. Conferir status público: enabled=true, recurringEnabled=true, voucherVersion=2026-10-30. Implementação depende de aprovação de escopo; mensalidade somente após entrega. O pedido define valores no servidor, inclusive promoção. Voucher é revalidado/reservado em cada componente e aplicado ao cupom Stripe antes do pagamento.
6. Validar o fluxo com promoção e os escopos setup, monthly, setup_and_first e setup_and_monthly; no combinado vitalício, setup tem cupom único e assinatura tem duração forever. Limites permitem dois resgates por cliente para as duas cobranças.

As migrações de vouchers, contatos, promoções e escopo combinado já foram aplicadas, registradas e testadas com rollback. Não reaplicar manualmente arquivos SQL sem consultar schema_migrations. Não habilitar cobrança como substituto da publicação/validação das funções.
