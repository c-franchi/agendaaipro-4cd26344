# Checkout de implementação e entrega — v3

## Oferta

| Plano | Implementação única | Mensalidade após disponibilização |
| --- | ---: | ---: |
| Agenda | R$ 250,00 | R$ 39,90 |
| Gestão e Vendas | R$ 350,00 | R$ 69,90 |
| Premium | R$ 690,00 | R$ 99,90 |

Fonte única: `supabase/functions/_shared/commerce.ts`, também importada pelo frontend. Não reutiliza os preços antigos de R$ 97/197/397 nem aceita valor, desconto, e-mail de cobrança ou plano arbitrário do navegador. Produtos/assinaturas antigos na Stripe são preservados.

## Fluxo

1. Cliente autenticado solicita o plano e aceita os termos. Nenhuma cobrança é criada.
2. Administração aprova e registra o escopo efetivamente disponível.
3. Cliente paga somente a implementação, à vista no cartão, pelo Stripe Checkout em `mode=payment`.
4. Webhook com assinatura válida confirma valor, moeda, sessão, ambiente, usuário e pedido. Marca pago e inclui o pedido na fila uma única vez.
5. Administração personaliza uma instalação independente a partir do template, configura login e módulos e valida o funcionamento.
6. Administração registra o domínio e a instalação e confirma a entrega. O cliente vê seu link em `/meus-pedidos`.
7. Somente após a entrega, o cliente pode contratar a mensalidade em um checkout separado, `mode=subscription`, mediante ativação da recorrência.

Pagamento não cria automaticamente um novo Site, domínio, banco nem conta Google. Esses itens e a personalização continuam sendo feitos pelo operador. Registrar o domínio no painel não altera automaticamente os módulos na instalação: o operador deve configurar o plano no sistema entregue e confirmar esse passo antes da liberação. A cobrança não permite prometer insumos por serviço que ainda não foram implementados.

A página de sucesso não confirma pagamento por URL/localStorage e não envia e-mail de confirmação baseado em dados do navegador. Usuários consultam apenas seus pedidos; mudanças financeiras e de andamento são exclusivamente do backend. Reenvios do webhook são idempotentes. Reembolso integral bloqueia a entrega/novo checkout; operador deve revisar o acesso da instalação e cancelar eventual assinatura na Stripe quando aplicável.

## Preparar a produção (desativada por padrão)

Publicar `commerce-orders`, `create-checkout` e `stripe-commerce-webhook`, com suas dependências em `_shared`, e aplicar a migração `20261028214548_commerce_checkout_orders.sql` no projeto existente. As funções de pedidos e checkout validam JWT pelo `auth.getUser`; o webhook valida assinatura Stripe. Nunca colocar service role ou segredo Stripe no frontend.

Configurações exclusivamente no ambiente seguro das Edge Functions:

- `STRIPE_SECRET_KEY`: chave do ambiente escolhido.
- `STRIPE_WEBHOOK_SECRET`: segredo do endpoint **deste ambiente**.
- `STRIPE_EXPECTED_ACCOUNT_ID`: ID da conta correta para produção.
- `STRIPE_CHECKOUT_ENABLED=true`: apenas depois da liberação documental da Stripe e teste do webhook. Ausente ou qualquer outro valor mantém o cartão bloqueado.
- `STRIPE_RECURRING_ENABLED=true`: apenas depois de validar a entrega e o fluxo da mensalidade; independente da ativação da implementação.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: bindings internos já existentes.

Endpoint do webhook: `/functions/v1/stripe-commerce-webhook`. Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

Não ativar produção enquanto a conta estiver em análise. O backend ainda exige `charges_enabled=true` e a correspondência do ID da conta em produção. Chave, assinatura e modo teste/produção devem coincidir. Não foram criadas cobranças reais nem alterações nos produtos antigos.

## Validação

```sh
node scripts/test-checkout-handler.mjs
# Dependências isoladas de QA, sem adicionar bibliotecas ao app:
npm install --prefix /tmp/agendai-commerce-test --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.13 stripe@18.5.0
COMMERCE_TEST_MODULES=/tmp/agendai-commerce-test/node_modules node scripts/test-commerce.mjs
node scripts/test-password-recovery.mjs
npx tsc --noEmit -p tsconfig.app.json
npm run build
npx deno check supabase/functions/create-checkout/index.ts supabase/functions/commerce-orders/index.ts supabase/functions/stripe-commerce-webhook/index.ts
```

Testes de QA usam contas, chaves, eventos e banco em memória fictícios. Cobrem RLS, permissões RPC, assinatura, adulteração de valor, moeda, usuário/ambiente, estados, pagamento único versus mensalidade, retries e reembolsos. O teste com cartão de teste no ambiente Stripe real depende de a integração segura ser configurada; não confundir os testes locais com uma transação de produção homologada.
