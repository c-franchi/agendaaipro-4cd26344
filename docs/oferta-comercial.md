# Oferta comercial do AgendaAÍ Pro

## Valores aprovados

| Plano   | Mensalidade | Implementação única |
| ------- | ----------: | ------------------: |
| Agenda  |    R$ 39,90 |           R$ 250,00 |
| Gestão  |    R$ 69,90 |           R$ 350,00 |
| Premium |    R$ 99,90 |           R$ 690,00 |

Todos incluem aplicação da logo, cores, contatos e informações do cliente na estrutura padrão, configuração inicial e orientação. O profissional edita os campos disponíveis no painel. Não se trata de desenvolver um layout novo para cada contratação.

A mensalidade começa na disponibilização do sistema e remunera ferramentas, hospedagem, manutenção técnica e suporte de uso. Não inclui criação de conteúdo mensal.

O Premium acrescenta preparação visual na entrega inicial: até 10 imagens fornecidas pelo cliente, até 10 itens de portfólio, 1 vídeo curto e 2 rodadas de revisão. Novas artes, vídeos, logo nova e alterações de conteúdo feitas pela equipe após a entrega são serviços avulsos.

A implementação inclui o primeiro ano de domínio .com.br, sujeito à disponibilidade. Renovação, taxas de pagamento, mensagens pagas e serviços externos são cobrados à parte. A proposta deve definir quantidade de profissionais, armazenamento, canais e horários de suporte antes de qualquer pagamento.

Prazo estimado: 15 a 20 dias úteis após contratação confirmada, implementação paga e recebimento dos materiais. Recursos ainda em preparação precisam de disponibilidade e prazo confirmados antes da cobrança.

## Contratação nesta versão

O site comercial registra interesse pelo formulário existente de leads ou oferece um link de WhatsApp com plano e valores preenchidos. O envio do formulário não cria assinatura nem processa pagamento.

O checkout automático anterior usava preços Stripe de R$ 97, R$ 197 e R$ 397, sem a implementação. A nova oferta não chama esse checkout, nem reutiliza valores de pagamento do armazenamento local. Não basta trocar o preço mostrado na interface para alterar a cobrança Stripe.

Os endpoints, preços e telas de consulta de assinaturas históricas foram preservados para clientes existentes. Nenhuma assinatura ou condição de cobrança existente é migrada por este código. A nova cobrança automática, com implementação separada e início da mensalidade na entrega efetiva, é uma etapa posterior a validar antes de reativar pagamentos no funil.

## Catálogo e painel administrativo

- `src/lib/constants.ts` concentra o catálogo vigente e o FAQ compartilhado.
- As chaves históricas `essencial`, `pro` e `premium` permanecem; os nomes públicos são Agenda, Gestão e Premium.
- O antigo `landing_content.pricing_plans` só pode fornecer imagens. Seus preços, nomes, promoções e promessas não substituem a oferta atual.
- `pricing_images_v2` guarda apenas imagens dos planos. A edição dessas imagens continua no painel.
- `hero_content_v2` permite editar a nova abertura. Imagens de `hero_content` são preservadas como fallback, sem reaproveitar o texto comercial antigo.
- `target_audiences_v2` guarda a nova comunicação para os públicos.
- Preços e escopo comercial ficam visíveis no painel em modo de consulta. A edição livre de preços deve ser reintroduzida junto da integração de cobrança, com validação no servidor.
- Não há migração nem mudança de esquema nesta versão: as novas chaves usam a tabela de conteúdo já existente.

## Próxima etapa: sistema entregue

Os módulos abaixo aparecem explicitamente como em preparação, sem promessa de disponibilidade imediata:

- Gestão e Premium: produtos, estoque, movimentações, vendas, fluxo de caixa e relatórios.
- Premium: insumos, consumo por serviço, baixa ao concluir atendimento e margem estimada com base nos custos registrados.

Implementar e validar esses módulos no repositório do sistema-base antes de ofertá-los como disponíveis. Os dados do Eric não são copiados para novos clientes. Esta alteração atua somente no funil comercial.

## Publicação

Validar em preview antes de integrar à main. O README informa sincronização da main com o Lovable; verificar o fluxo real de publicação e a versão no domínio depois da publicação autorizada.
