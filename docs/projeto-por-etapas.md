# Projeto em páginas por etapa

Rotas do cliente: `/meus-pedidos/:pedido/:etapa`. Rotas do operador: `/admin/pedidos/:pedido/:etapa`. A lista de pedidos mostra resumo e entradas para o projeto, sem incorporar formulários, arquivos, histórico e conversas no cartão.

Etapas: resumo; negocio; servicos; identidade; arquivos; conferencia; producao; entrega. Conversa, atendimento, avisos e contrato são páginas auxiliares. A navegação no desktop permanece visível e no celular fica recolhida; indica página atual e conclusão conforme dados efetivamente salvos, não conforme páginas visitadas.

Salvar e continuar aguarda confirmação do RPC antes da navegação. Links internos verificam alterações não salvas e o recarregamento tem aviso. Rascunhos em memória são protegidos contra a atualização automática; descartar restaura os valores do servidor, sem salvar campos escondidos acidentalmente. Upload registra o arquivo no servidor automaticamente e não depende de salvar os dados do negócio. Rodapé de ações junto à etapa, com progresso e estado de salvamento.

Conferência usa somente dados salvos e reúne revisão do negócio, serviços, identidade e arquivos antes de enviar. Enviar materiais não inicia produção: a equipe continua conferindo e aprovando arquivos, iniciando a preparação pelo mesmo RPC protegido. A prévia, revisões, aprovação expressa do cliente e liberação da mensalidade preservam as regras anteriores. Não há migração de banco nem alteração de pedidos e arquivos existentes.

A consulta do pedido exige conta autenticada, titular para a rota do cliente ou administrador verificado para a rota administrativa; RLS continua valendo. Links antigos de atendimento com `?order=...&panel=atendimento` são redirecionados; links de avisos que apontam à lista continuam funcionando.

Validação: `node scripts/test-project-pages.cjs` usa JSDOM isolado em PROJECT_UI_TEST_MODULES (padrão /tmp/agendai-project-qa/node_modules), mocks de RPC/storage e nenhuma chamada a Supabase. Cobre navegação, persistência por etapa, proteção/descarte de rascunho, upload independente e transição para conferência, sem iniciar produção. Os testes SQL/RLS de scripts/test-workspace.mjs continuam aplicáveis. Tipos e build obrigatórios.

Referências de desenho: divulgação progressiva e tarefas por etapa, evitando expor todas as ferramentas simultaneamente:
- https://playbook.ebay.com/design-system/patterns/progressive-disclosure
- https://www.nngroup.com/articles/progressive-disclosure/
