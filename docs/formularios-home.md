# Formulários e detalhes das solicitações

A tabela administrativa de leads agora abre os campos já salvos (mensagem, origem, contato, área e data). Os registros antigos são preservados; informações que nunca foram fornecidas não são inventadas. O formulário de proposta mantém um resumo após o envio, inclusive mensagem/plano, e informa falha no e-mail separadamente do salvamento.

As opções de área são compartilhadas entre proposta e contratação, com Outra área para texto livre. O pedido autenticado inclui WhatsApp, área, nome do negócio e observações; o e-mail vem da sessão autenticada. Novas informações aparecem para o proprietário e o operador em Meus pedidos/Pedidos.

Rodapé aponta para https://fllifranchi.com. Botão flutuante volta ao topo da home após rolagem; o modal tem ação equivalente para seu próprio conteúdo. Não há salto automático que interrompa a leitura.

## Publicação

Código preparado pelo GitHub sem chamadas ao Lovable. Antes de publicar frontend, aplicar `20261029003000_order_contact_details.sql` no banco e implantar `commerce-orders`, `send-lead-email` e seus módulos compartilhados. As pendências de vouchers da versão anterior continuam descritas em `vouchers-commerce-v3.md`. Não ativar cobranças como parte desta atualização.

Testes locais usam dados fictícios e e-mail simulado. O recebimento real depende da chave Resend, remetente verificado e configuração do administrador; nenhuma notificação real foi enviada durante os testes. Não declarar entrega de e-mail ou publicação com base somente em build local.
