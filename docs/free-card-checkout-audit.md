# Revisão da conclusão da implementação — 26/11/2026

## Regra
O cliente conclui o pagamento ou o cadastro seguro do cartão uma vez para liberar a implementação automaticamente, sem conta na Stripe. Voucher que zera a implementação não dispensa a autorização do cartão. A mensalidade continua sendo contratada após a entrega aprovada, como no contrato existente; esta correção não autoriza cobranças antecipadas.

## Locais lidos e resultado
- `CardOrderRequest.tsx`: contratação autenticada, aceite e checkout. Agora explica cadastro sem cobrança quando implementação é zero; falha na abertura mantém referência ao pedido para retomada.
- `OrdersList.tsx`: pagamento inicial e retomada; passa pelo mesmo servidor. Corrigidos botão e explicação de implementação gratuita. Mensalidade mantém aceite separado após entrega.
- `_shared/commerce.ts`: parâmetros e correspondência de sessão. Implementação zero usa setup mode; valores positivos continuam payment mode, salvando cartão para uso futuro. Subscrição segue subscription mode.
- `create-checkout/index.ts`: autenticação, dono, contrato, reserva e conta Stripe. Agora cria Checkout para cadastro de cartão quando devido é zero, sem cupom ou cobrança. Retentativa autenticada expira somente sessão antiga aberta de total zero antes de reservar novamente. Sessões concluídas não são substituídas.
- `stripe-commerce-webhook/index.ts`: assinatura, ambiente, pedido, voucher, autorização e aprovação. SetupIntent bem-sucedido, cliente correto, cartão e metadata são verificados; sessão atual precisa estar completa. Só então registra implementação por zero e libera produção. Repetição não altera o cartão padrão após pagamento; conclusão legada de zero sem cartão não libera novo pedido.
- `commerce_record_payment` e `commerce_release_voucher`: definições de produção consultadas apenas por leitura. A função de pagamento já aceita valor zero e cliente, deduplica eventos e aciona consumo transacional do voucher; nenhuma migração necessária.
- SQL de vouchers e workspace: reserva/consumo, evento transacional, criação de workspace após pagamento e bloqueio de mensalidade antes da entrega conferidos. Notificação interna usa a expressão histórica “implementação paga” também quando isenta; não altera a cobrança. Nenhum registro histórico foi reescrito.
- `PaymentSuccess.tsx`, `Project.tsx`, `OrderWorkspace`, `ManagedSubscriptions.tsx`, `commerce-subscriptions`, `MyProfile.tsx`, `DeploymentsManager`: consumidores do estado persistido; não aprovam por parâmetros de URL nem confundem implementação com mensalidade. Área comercial segue usando pedidos para refletir conclusão.
- `order-notifications` e `_shared/order-notifications.ts`: notificam estado persistido com idempotência; não autorizam cartões nem cobram. Rotina e fila reais não foram executadas em testes.
- `create-free-subscription`: caminho antigo permanece desativado (410).
- `CheckoutModal`, proposta WhatsApp, `LogoServiceRequest`: proposta/atendimento não são pagamento e não devem liberar produção sozinhos; preservados.
- `MySubscription`, `check-subscription`, `customer-portal`: caminhos antigos não concluem implementação; mantidos fora da alteração. Foi identificada necessidade de revisão de segurança separada: consultas/portal antigos aceitam e-mail sem autenticação própria no código. Não alterados neste pedido para preservar o limite sobre permissões e configurações.

## Verificação
- Testes de handlers locais: checkout gratuito → cartão autorizado → webhook → pedido em fila; também recusa de cartão incompleto, assinatura inválida, cliente divergente e voucher inválido, replays e retomada de sessão antiga.
- Testes SQL em PGlite descartável: valores, vouchers, consumo, pagamento zero com cliente persistido e nenhuma mensalidade, transições, assinatura após entrega, RLS e reembolso.
- Regressão de checkout normal e recuperação de senha; testes de resumos e compartilhamento de voucher.
- Tela de pedido com fixture em 360 e 1280 px: total zero, leitura e ausência de transbordamento; sem erros de renderização. Não equivale a uma compra real autenticada.
- Funções `create-checkout` e `stripe-commerce-webhook` publicadas; status 200, acesso sem identidade válida 401 e webhook sem assinatura 400. Flags/configurações preservadas.
- Pedido real consultado após a publicação: continua pendente, sem cliente/cartão/assinatura registrados; nenhuma cobrança, cliente, assinatura ou e-mail de teste foi criado em produção.

## Limites e retomada
O cliente precisa voltar a Meus pedidos e continuar a contratação; a sessão antiga não pode registrar um cartão retroativamente. O servidor substitui a tentativa aberta ao retomar. A aprovação automática depende da conclusão do cadastro pelo cliente e do webhook válido. A cobrança real/cartão real não foram testados nesta revisão. Os textos novos dependem da publicação do frontend pelo proprietário.