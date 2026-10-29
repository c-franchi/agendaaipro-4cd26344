# Vouchers no checkout v3

Implementação única e mensalidade aceitam códigos independentes em Meus pedidos. A prévia é calculada no servidor sem reservar usos. O checkout revalida e reserva atomicamente; somente uma confirmação financeira válida consome o uso. O preço-base não muda. Mensalidade usa coupon Stripe por 1–12 meses; depois retorna ao valor integral. Descontos de 100% na implementação são exibidos como isenção, sem inventar PaymentIntent.

No painel, revisar cada voucher antigo e marcar a autorização para o novo checkout. Datas determinam o prazo de resgate; `discount_months` determina a duração mensal. `setup_and_first` abrange implementação e primeira mensalidade; cada componente conta como um uso independente. Para conceder os dois ao mesmo cliente, configurar limite por usuário >=2. A opção monthly aplica à mensalidade durante a duração explícita. Não altera assinaturas já existentes.

## Atualização pendente no ambiente hospedado

Nenhuma chamada de implementação/publicação ao Lovable foi feita nesta alteração, conforme solicitado. Sincronizar código do GitHub, aplicar a migração `20261029000100_commerce_vouchers.sql` e implantar create-checkout, stripe-commerce-webhook, validate-voucher, create-free-subscription e dependências compartilhadas. Migração deve preceder funções e frontend. Não publicar apenas o frontend contra o backend antigo.

Adicionar `checkout.session.expired` aos eventos do webhook existente. Isso libera reservas de sessões abandonadas após expiração confirmada na Stripe. Uma nova tentativa também verifica expiração antes de liberar. Reservas sem sessão por falha de comunicação ficam retidas para retry idempotente: não limpar por tempo sem reconciliar a idempotency key Stripe; investigar manualmente se a tentativa não for retomada. Essa cautela evita descontar um uso que ainda possa ter gerado checkout.

Flags de checkout/recorrência continuam desativadas. Validar em ambiente Stripe de testes antes de ativar: cupom percentual/fixo/100%, primeira mensalidade e renovação após desconto, expiração e reenvio de webhook. Os testes locais não são transações Stripe reais. Cupons são criados somente quando o comprador inicia o checkout habilitado; nenhuma cobrança, cliente ou assinatura foi criada nesta implementação.

Execução local: `COMMERCE_TEST_MODULES=/tmp/agendai-commerce-test/node_modules node scripts/test-vouchers.mjs`, `node scripts/test-checkout-handler.mjs`, `COMMERCE_TEST_MODULES=/tmp/agendai-commerce-test/node_modules node scripts/test-commerce.mjs`, `node scripts/test-password-recovery.mjs`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`.
