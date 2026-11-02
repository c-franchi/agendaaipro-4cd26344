# Endereço incluído por plano
Novas contratações: Agenda inclui subdomínio (ex.: meunegocio.agendaaipro.com.br), sujeito à disponibilidade e configuração pela equipe. Domínio próprio no Agenda é opcional, mediante orçamento e aprovação separados; não há preço adicional inventado nem cobrança automática. Gestão e Premium incluem primeiro ano de domínio .com.br disponível; renovação à parte. Preços dos planos permanecem iguais.

## Implantação
1. Revisar e aplicar docs/sql/address-policy.sql no projeto Supabase correto antes de publicar o frontend. O script preserva pedidos existentes com own-domain-v1 e define plan-address-v2 para novos pedidos. As cópias aceitas não são alteradas.
2. Confirmar que commerce_contract_template devolve a versão 2026-11-02-v2. O cliente Agenda não pode prosseguir com o contrato antigo quando já vê a oferta nova; Gestão e Premium continuam compatíveis com a condição anterior.
3. Publicar o frontend. Conferir home, FAQ, checkout e contrato de teste sem efetuar cobrança real.
4. Ao entregar cada instalação, configurar seu hostname, DNS e certificado na hospedagem. Esta alteração NÃO provisiona DNS, certificados nem roteamento de tenants. Nunca apontar subdomínio para uma instalação de outro cliente.

## Validação
TypeScript e build. scripts/test-address-policy.mjs testa o fluxo anterior e a política nova com banco PGlite isolado: contrato novo, cópia antiga imutável, vínculo de política por pedido e aceite com fingerprint correto.
Acesso de produção ao Supabase foi negado pelo conector nesta sessão; SQL ainda não aplicado. Publicação deve aguardar essa etapa.
