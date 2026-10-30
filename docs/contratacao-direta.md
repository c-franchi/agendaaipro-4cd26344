# Contratação direta e acompanhamento

Novos pedidos usam contract_flow=direct e começam em awaiting_payment, com preços recalculados e registrados no servidor. O cliente confere o resumo, aceita os termos e segue imediatamente ao checkout da implementação. Falha ao abrir o checkout mantém o pedido e oferece retomada em Meus pedidos, sem duplicá-lo. Pedidos anteriores preservam o fluxo assistido.

Após confirmação segura da Stripe, uma transação registra pagamento, cria o acompanhamento e agenda os avisos para operador e cliente. A volta do checkout sozinha não libera materiais. Aprovação de escopo manual não é necessária no fluxo novo. Conta de acompanhamento não equivale ao painel administrativo do site profissional; a instalação independente continua sendo criada/configurada pela equipe.

## Produção e entrega

- Todos os planos: nome, contato público, serviços/preços/duração, expediente, apresentação e escolha entre logo pronta ou identidade em texto. Envios JPG/PNG/WebP e PDF até 10 MB; MP4/WebM até 50 MB. Bucket privado; até 40 arquivos ativos, com histórico preservado.
- Premium: orientações para preparação inicial de 10 imagens, 10 itens de portfólio, 1 vídeo e 2 rodadas criativas; não inclui produção mensal. Agenda/Gestão fornecem conteúdo pronto.
- Cliente salva informações, envia arquivos e confirma envio para conferência. Novas alterações invalidam essa confirmação. Equipe aprova arquivos ou pede correção; só inicia produção após materiais completos. O início registra a data de contagem do prazo.
- Conversa por pedido com autoria e horários; atualização a cada 30 segundos. Mensagens e decisões ficam no sistema, com WhatsApp complementar.
- Equipe cadastra URL HTTPS, instalação e confirma módulos para enviar prévia. Cliente pede ajustes ou aprova. Somente o titular aprova; após isso o pedido passa a ready e libera contratação da mensalidade. Aprovar não efetua cobrança. Guard no banco impede pular aprovação em pedidos diretos.

## Segurança e notificações

Todas as escritas passam por RPC autenticada; funções privilegiadas ficam em commerce_private com search_path fixo e verificação de titular/operador. Sem gravação direta do cliente em mensagens, etapas, arquivos ou fila. Storage confere pedido, identidade, fase, MIME e tamanho; links são temporários. Função de notificação aceita apenas titular/operador e não aceita destinatário do cliente. Remetente usa EMAIL_FROM e RESEND_API_KEY existentes; não usar outro projeto como remetente nem considerar e-mail enviado sem aceitação do provedor.

Fila transacional com chave de idempotência por aviso, backoff, lease e tentativas limitadas. Falha de aviso não desfaz pagamento nem dados; o envio de e-mail não bloqueia a confirmação do pagamento. Um job backend deve chamar a ação drain de order-notifications a cada minuto com segredo dedicado ORDER_NOTIFICATIONS_CRON_SECRET guardado no Vault, sem expô-la no código nem no cliente. Só o token interno dedicado aceita drain; clientes só processam avisos do próprio pedido. Há contador no acompanhamento e ação do operador para tentar avisos falhos novamente. `sent` significa aceito pelo provedor, não comprova entrega na caixa de entrada.

Publicar create-checkout, stripe-commerce-webhook e order-notifications com o helper _shared/order-notifications.ts. Preservar flags de pagamento e segredos. Confirmar remetente verificado no Resend; se faltar DNS, deixar fila pendente e informar configuração necessária, sem usar domínio de outra marca. Não disparar avisos de teste para clientes reais nem criar pagamentos reais nos testes.

## Validações

`test-workspace.mjs`: migrações, pedido direto, confirmação idempotente, isolamento entre clientes, upload privado, conferência, mensagens, revisões, aprovação e bloqueio da mensalidade antes da entrega. `test-order-notifications.mjs`: mocks do provedor, destinatários fixos, escape e repetição/falhas. Demais testes de checkout e recuperação preservados. Não substituem teste de compra real com Stripe nem comprovação de recebimento de e-mail.

Configurar cron `agendai-order-notifications`, expressão `* * * * *`, via pg_cron/pg_net e Supabase Vault. Usar apenas a URL deste projeto e seu segredo dedicado ORDER_NOTIFICATIONS_CRON_SECRET (gerado aleatoriamente, pelo menos 32 bytes, também configurado na função), nunca persistir o valor em arquivos/Git ou imprimi-lo. Se cron/Vault indisponível, relatar a limitação; não afirmar retry em segundo plano. Preservar jobs existentes. A consulta cron só deve chamar a função quando houver itens pending/sending com attempts<5; não invocar quando a fila estiver vazia. O segredo dedicado só autoriza o processamento da fila, não concede acesso geral ao banco.
