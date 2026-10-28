# Integração de vouchers ao checkout commerce v3

## Escopo e preservação

Integrar os vouchers existentes aos pedidos e ao checkout, separando implementação e mensalidade. Preservar layout, dados legados, recuperação de senha, permissões e assinaturas existentes.

Preços-base permanecem: implementação R$ 250/350/690 e mensalidade R$ 39,90/69,90/99,90. As duas flags de cobrança continuarão desligadas. Nenhuma transação, cliente, produto ou assinatura real será criado durante a validação.

## Compatibilidade e administração

- Manter `vouchers` e `voucher_uses`; acrescentar configuração explícita para uso no commerce v3 e restrições opcionais de plano.
- Usar rótulos claros: `setup` = implementação; `monthly` = mensalidade pela duração configurada; `first_payment` = primeira mensalidade; `setup_and_first` = implementação e primeira mensalidade. A duração de `first_payment` e `setup_and_first` será um ciclo, explicitamente indicada.
- Separar datas de resgate da quantidade de meses de desconto. Não inferir duração pelas datas.
- Vouchers legados não terão significado modificado automaticamente: ficarão indisponíveis no v3 até a administração revisar e confirmar escopo/duração. O cadastro conservará os valores anteriores para revisão.
- Limites serão contabilizados por resgate de componente: implementação e mensalidade são resgates independentes, inclusive quando o mesmo código admite ambos. Mostrar essa regra no cadastro.

## Pedido, validação e reservas

- Código independente para implementação e mensalidade, no pedido e na respectiva contratação. Mostrar original, desconto, final e duração; a prévia não garante disponibilidade futura.
- Revalidar usuário autenticado, proprietário, plano do catálogo, escopo, status, datas e limites no servidor. Ignorar valores, e-mail e identificadores de voucher enviados pelo navegador.
- Calcular descontos percentuais e fixos com arredondamento em centavos e limite ao valor original. Quando ambos são autorizados, calcular cada componente separadamente.
- Congelar um snapshot auditável por tentativa, incluindo valores-base/líquidos, voucher, proprietário, duração e vínculo da sessão.
- Reservar atomicamente sob bloqueio de voucher/pedido, contando reservas válidas junto com usos consumidos. Tentativas repetidas reutilizam a mesma reserva/sessão; tentativa concorrente não ganha uma segunda sessão.
- Consumir reserva e gravar `voucher_uses` na mesma transação da confirmação. Expiração/cancelamento/falha liberam a reserva de forma idempotente; a decisão usa o estado verificado da sessão para não liberar pagamento em processamento.

## Stripe e confirmação

- Implementação com desconto não contrata nem desconta automaticamente a assinatura.
- Mensalidade com desconto Stripe real, de duração finita, mantendo preço recorrente-base. Vincular coupon/discount à tentativa e validar contrato, proprietário, moeda, ambiente e períodos subsequentes.
- Webhook verifica sessão, owner, snapshot e líquido esperado; validação de pagamento/reembolso e gravação idempotente permanecem transacionais.
- Desconto de 100% na implementação registra **isenção**, não pagamento fictício: somente após escopo aprovado e confirmação autoritativa; não libera assinatura. Mensalidade de 100% exige contrato Stripe verificável e tratamento explícito de `no_payment_required`, mantendo cobrança futura-base.
- Desabilitar definitivamente a concessão pelo endpoint legado `create-free-subscription`, com resposta clara sem gravar usos nem enviar e-mails. `validate-voucher` passa a exigir autenticação e usar a mesma validação autoritativa, sem logs de payloads.
- Remover permissões de gravação direta de usos e execução pública de `increment_voucher_uses`; manter leitura do usuário/admin e operações financeiras exclusivas do servidor.

## Detalhes técnicos

- Migração aditiva para configuração revisada, snapshots/reservas e funções transacionais, com grants/RLS explícitos e RPCs restritas ao servidor.
- Compartilhar regras entre handlers por módulos sob `_shared`; registrar decisões estruturais em `AGENTS.md`.
- Adaptar `commerce-orders`, `create-checkout`, `stripe-commerce-webhook`, `validate-voucher` e `create-free-subscription`, além dos formulários e administração existentes.
- Não modificar secrets nem ativar `STRIPE_CHECKOUT_ENABLED`/`STRIPE_RECURRING_ENABLED`.

## Testes e implantação

- Executar handlers reais com dependências externas simuladas e migração real em banco de QA; testar percentuais, fixos, 100%, escopos, planos, duração, datas, limites, adulteração, concorrência, replay, liberação de reservas, líquido do webhook, contrato recorrente e reembolsos.
- Rodar testes commerce/checkout/password recovery existentes e novos. O ambiente executa automaticamente typecheck/build; verificar seus resultados sem declarar sucesso antecipado.
- Aplicar a migração ao Cloud, confirmar estrutura, RLS/grants e implantação das funções, testar recusa anônima e status de flags desligadas.
- Verificar telas desktop/mobile sem criar pedidos ou transações reais. Usar apenas fixtures isoladas para fluxos mutáveis.
- Relatar SHA disponível, arquivos alterados, testes executados, migração/deploy confirmados e limitações. Não publicar o frontend.

## Inspeção inicial

O checkout atual não aplica vouchers. A validação legada aceita e-mail e valor do navegador; o endpoint gratuito concede confirmação sem autenticação/limites completos. `voucher_uses` permite inserção por qualquer autenticado e `increment_voucher_uses` tem execução pública: esses caminhos precisam ser fechados junto com a integração.

A revisão de site disponível é a skill SEO Review; consultar os resultados existentes, sem ampliar este trabalho para mudanças de SEO/layout.