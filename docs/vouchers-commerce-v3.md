# Vouchers no checkout v3

Implementação única e mensalidade aceitam códigos independentes em Meus pedidos. A prévia é calculada no servidor sem reservar usos. O checkout revalida e reserva atomicamente; somente uma confirmação financeira válida consome o uso. O preço-base não muda. Mensalidade usa coupon Stripe por 1–12 meses; depois retorna ao valor integral. Descontos de 100% na implementação são exibidos como isenção, sem inventar PaymentIntent.

No painel, revisar cada voucher antigo e marcar a autorização para o novo checkout. Datas determinam o prazo de resgate; `discount_months` determina a duração mensal. `setup_and_first` abrange implementação e primeira mensalidade; cada componente conta como um uso independente. Para conceder os dois ao mesmo cliente, configurar limite por usuário >=2. A opção monthly aplica à mensalidade durante a duração explícita. Não altera assinaturas já existentes.

## Atualização pendente no ambiente hospedado

Nenhuma chamada de implementação/publicação ao Lovable foi feita nesta alteração, conforme solicitado. Sincronizar código do GitHub, aplicar a migração `20261029000100_commerce_vouchers.sql` e implantar create-checkout, stripe-commerce-webhook, validate-voucher, create-free-subscription e dependências compartilhadas. Migração deve preceder funções e frontend. Não publicar apenas o frontend contra o backend antigo.

Adicionar `checkout.session.expired` aos eventos do webhook existente. Isso libera reservas de sessões abandonadas após expiração confirmada na Stripe. Uma nova tentativa também verifica expiração antes de liberar. Reservas sem sessão por falha de comunicação ficam retidas para retry idempotente: não limpar por tempo sem reconciliar a idempotency key Stripe; investigar manualmente se a tentativa não for retomada. Essa cautela evita descontar um uso que ainda possa ter gerado checkout.

Flags de checkout/recorrência continuam desativadas. Validar em ambiente Stripe de testes antes de ativar: cupom percentual/fixo/100%, primeira mensalidade e renovação após desconto, expiração e reenvio de webhook. Os testes locais não são transações Stripe reais. Cupons são criados somente quando o comprador inicia o checkout habilitado; nenhuma cobrança, cliente ou assinatura foi criada nesta implementação.

Execução local: `COMMERCE_TEST_MODULES=/tmp/agendai-commerce-test/node_modules node scripts/test-vouchers.mjs`, `node scripts/test-checkout-handler.mjs`, `COMMERCE_TEST_MODULES=/tmp/agendai-commerce-test/node_modules node scripts/test-commerce.mjs`, `node scripts/test-password-recovery.mjs`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`.

## Desconto vitalício e prazo de resgate

A migração `20261030014834_voucher_lifetime.sql` permite `discount_months=0`: desconto enquanto a assinatura continuar ativa. Valores de 1 a 12 mantêm duração finita. O checkout cria cupom Stripe `duration=forever` para a mensalidade com zero meses; implementação e primeira mensalidade permanecem únicas. Isso não transfere o desconto para uma nova assinatura nem altera assinaturas existentes.

A validade para novos resgates é independente: `expires_at=NULL` significa sem expiração. O ADM oferece as duas escolhas separadas. As regras de quantidade de usos, escopo, autorização e reservas continuam válidas.

Correção de produção: a migração de vouchers de 29/10 não estava aplicada, causando erro de coluna `commerce_enabled`. Foi aplicada com a migração de duração, histórico de migrações registrado e cache REST notificado. Inserção de voucher vitalício testada sob papel authenticated com identidade do operador, dentro de transação revertida; nenhum voucher de teste permaneceu salvo.

A publicação do frontend pelo Lovable não publica Edge Functions. A conexão Supabase da sessão não tem acesso ao projeto `paajzwvuccvdveejdown`. Publicar os arquivos atualizados de `create-checkout`, `validate-voucher`, `stripe-commerce-webhook` e `create-free-subscription` antes de habilitar cobrança. Preservar autenticação e variáveis existentes; não expor segredos. Checkout permanece desabilitado até validação da integração.

## Promoções públicas e voucher na solicitação

ADM → Landing → Planos → Promoções dos planos: uma campanha por plano, com início/fim, valores em reais, ativação e opção de acumular voucher (desligada por padrão). Nenhuma campanha é criada/ativada pela migração. Preços só podem ser positivos e iguais ou inferiores ao catálogo. A mensalidade promocional permanece no contrato; não há retorno automático ao valor normal depois de N meses. O fim da campanha afeta novas solicitações, não pedidos existentes.

Home e modal usam a tabela pública de campanhas ativas. A contratação consulta `commerce_offer_quote` e grava por `commerce_request_offer`, sem depender de uma função Edge nova para criar o pedido. O banco recalcula preços, exige identidade, valida os contatos e o fingerprint da oferta, registra auditoria e guarda preços, campanha e códigos em cada pedido. As funções privilegiadas ficam em schema privado, com busca fixa, identidade obrigatória e acesso revogado a PUBLIC/anon. RPCs públicas são invoker; gravação direta do pedido pelo cliente continua proibida.

O voucher aparece na contratação e é indicado para implementação/mensalidade conforme seu escopo. A prévia não reserva usos: validade e limites são revalidados no checkout, evitando promessa de código expirado. O preço da campanha fica preservado no pedido; as regras de acumulação também ficam registradas e são conferidas pela reserva no servidor. Atualização de campanhas não altera assinaturas nem pedidos antigos.

Publicar `create-checkout` e demais funções de vouchers pendentes antes de habilitar cobrança. A sessão continua sem acesso ao deploy das Edge Functions do projeto Lovable. A publicação do frontend não comprova que o checkout está atualizado.
