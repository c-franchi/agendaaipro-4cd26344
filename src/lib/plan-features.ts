export const FEATURE_LABELS:Record<string,string>={agendamentos:'Agendamentos',clientes:'Clientes',servicos:'Serviços',horarios:'Horários',estoque:'Estoque',produtos:'Produtos',vendas:'Vendas',financeiro:'Financeiro',insumos:'Insumos',consumo_materiais:'Consumo de materiais',multiprofissional:'Multiprofissionais'};
const AGENDA=['agendamentos','clientes','servicos','horarios'];
const GESTAO=[...AGENDA,'estoque','produtos','vendas','financeiro'];
const PREMIUM=[...GESTAO,'insumos','consumo_materiais','multiprofissional'];
export const PLAN_FEATURES:Record<string,string[]>={agenda:AGENDA,gestao:GESTAO,premium:PREMIUM};
export const PLAN_LABELS:Record<string,string>={agenda:'Agenda',gestao:'Gestão',premium:'Premium'};
export const allowedFeatures=(plan:string)=>PLAN_FEATURES[(plan||'').toLowerCase()]??[];
export const STATUS_LABELS:Record<string,string>={preparando:'Preparando',copia_criada:'Cópia criada',personalizando:'Personalizando',em_conferencia:'Em conferência',aguardando_aprovacao:'Aguardando aprovação do cliente',ajustes_solicitados:'Ajustes solicitados',aprovado:'Aprovado',entregue:'Entregue',cancelado:'Cancelado'};
export const HOMOLOGATION_LABELS:Record<string,string>={rascunho:'Rascunho',em_homologacao:'Em homologação',homologado:'Homologado',suspenso:'Suspenso'};
