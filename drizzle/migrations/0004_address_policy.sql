-- Apply once after reviewing the deployment. Existing orders and accepted snapshots retain their terms.
ALTER TABLE public.business_orders ADD COLUMN IF NOT EXISTS address_policy text;
UPDATE public.business_orders SET address_policy='own-domain-v1' WHERE address_policy IS NULL;
ALTER TABLE public.business_orders ALTER COLUMN address_policy SET DEFAULT 'plan-address-v2';
ALTER TABLE public.business_orders ALTER COLUMN address_policy SET NOT NULL;
INSERT INTO public.commerce_contract_templates(version,document)
 SELECT '2026-11-02-v2',jsonb_set(jsonb_set(jsonb_set(document,'{version}','"2026-11-02-v2"'),'{clauses,0,body}',to_jsonb('Configuração de um site com a identidade e os materiais do contratante e sistema PWA acessível pelo navegador e instalável em dispositivos compatíveis. O endereço incluído depende do plano, conforme a cláusula de domínio. Uma agenda por instalação. Os módulos são os do plano no resumo. Não inclui cessão de código-fonte, desenvolvimento exclusivo ou publicação na Play Store.'::text)),'{clauses,4,body}',to_jsonb('Para novas contratações no plano Agenda, inclui subdomínio do AgendaAÍ Pro, como meunegocio.agendaaipro.com.br, sujeito à disponibilidade do nome e à configuração pela equipe. Não inclui registro de domínio próprio. Domínio próprio pode ser contratado à parte, com orçamento, aceite e pagamento separados. Gestão e Premium incluem o primeiro ano de um domínio .com.br disponível, escolhido em conjunto; renovação cobrada separadamente, com informação prévia. O uso do endereço e do sistema hospedado depende da assinatura contratada após a entrega. Cancelamento, disponibilização de dados e transferência de domínio próprio devem ser solicitados pelo atendimento. Pedidos anteriores conservam suas condições e cópias aceitas.'::text))
 FROM public.commerce_contract_templates WHERE version='2026-10-30-v1'
 ON CONFLICT(version) DO NOTHING;
CREATE OR REPLACE FUNCTION commerce_private.contract_document(p_plan text,p_quote jsonb,p_name text,p_email text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,pg_temp AS $$
 SELECT document||commerce_private.provider_document()||jsonb_build_object('customer',jsonb_build_object('name',p_name,'email',p_email),'plan',p_plan,'quote',p_quote,'modules',document->'modulesByPlan'->>p_plan) FROM commerce_contract_templates WHERE version=CASE WHEN p_quote->>'addressPolicy'='own-domain-v1' THEN '2026-10-30-v1' ELSE '2026-11-02-v2' END AND active
$$;
-- Preserve complete existing implementations and their security checks; patch only policy/version selection.
DO $$
DECLARE definition text;BEGIN
 definition:=pg_get_functiondef('commerce_private.record_contract(public.business_orders,jsonb)'::regprocedure);
 definition:=replace(definition,'p_quote||jsonb_build_object(', 'p_quote||jsonb_build_object(''addressPolicy'',p_order.address_policy,');
 EXECUTE definition;
 definition:=pg_get_functiondef('commerce_private.order_contract(uuid,text,boolean,text)'::regprocedure);
 definition:=replace(definition,'contract_document(o.plan_type,q,o.name,o.email)','contract_document(o.plan_type,q||jsonb_build_object(''addressPolicy'',o.address_policy),o.name,o.email)');
 EXECUTE definition;
 definition:=pg_get_functiondef('commerce_private.request_offer(text,uuid,jsonb,text,text,text)'::regprocedure);
 definition:=replace(definition,'''2026-10-30-v1''','''2026-11-02-v2''');
 EXECUTE definition;
 definition:=pg_get_functiondef('commerce_private.contract_template()'::regprocedure);
 definition:=replace(definition,'''2026-10-30-v1''','''2026-11-02-v2''');
 EXECUTE definition;
END$$;
NOTIFY pgrst,'reload schema';