\set ON_ERROR_STOP 1
ALTER TABLE business_orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
INSERT INTO user_roles(user_id,role) VALUES ('a0000000-0000-0000-0000-000000000001','admin');
INSERT INTO affiliates(id,code,name) VALUES ('f0000000-0000-0000-0000-000000000001','JOAO','João Teste');
INSERT INTO business_orders(id,user_id,module_plan) VALUES ('b0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','agenda');
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000009',false);
DO $$BEGIN IF affiliate_attach('b0000000-0000-0000-0000-000000000001','joao') THEN RAISE 'FALHOU: estranho vinculou'; END IF; RAISE NOTICE 'OK outro usuário não vincula'; END$$;
DO $$BEGIN IF (SELECT count(*) FROM affiliates)<>0 THEN RAISE 'FALHOU: não-admin vê afiliados'; END IF; RAISE NOTICE 'OK não-admin não vê afiliados'; END$$;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000001',false);
DO $$BEGIN IF NOT affiliate_attach('b0000000-0000-0000-0000-000000000001','joao') THEN RAISE 'FALHOU vincular'; END IF; RAISE NOTICE 'OK dono vincula código'; END$$;
DO $$BEGIN BEGIN PERFORM affiliate_record_commission('b0000000-0000-0000-0000-000000000001','x','setup',100); RAISE 'FALHOU: cliente registrou comissão'; EXCEPTION WHEN insufficient_privilege THEN RAISE NOTICE 'OK cliente não registra comissão'; END; END$$;
RESET ROLE;
SELECT affiliate_record_commission('b0000000-0000-0000-0000-000000000001','evt_setup','setup',100000);
SELECT affiliate_record_commission('b0000000-0000-0000-0000-000000000001','evt_setup','setup',100000);
SELECT affiliate_record_commission('b0000000-0000-0000-0000-000000000001','evt_m1','monthly',19900);
SELECT affiliate_record_commission('b0000000-0000-0000-0000-000000000001','evt_m2','monthly',19900);
DO $$BEGIN
 IF (SELECT commission_cents FROM affiliate_commissions WHERE event_id='evt_setup')<>15000 THEN RAISE 'FALHOU 15%%'; END IF; RAISE NOTICE 'OK 15%% de R$1000 = R$150';
 IF (SELECT commission_cents FROM affiliate_commissions WHERE event_id='evt_m1')<>995 THEN RAISE 'FALHOU 5%%'; END IF; RAISE NOTICE 'OK 5%% de R$199 = R$9,95';
 IF (SELECT count(*) FROM affiliate_commissions WHERE kind='monthly')<>2 THEN RAISE 'FALHOU mensal'; END IF; RAISE NOTICE 'OK cada mensalidade gera comissão';
 IF (SELECT count(*) FROM affiliate_commissions WHERE event_id='evt_setup')<>1 THEN RAISE 'FALHOU idempotência'; END IF; RAISE NOTICE 'OK evento repetido não duplica';
END$$;
SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','a0000000-0000-0000-0000-000000000001',false);
UPDATE affiliate_commissions SET status='paid' WHERE event_id='evt_setup';
DO $$BEGIN IF (SELECT paid_at FROM affiliate_commissions WHERE event_id='evt_setup') IS NULL THEN RAISE 'FALHOU paid_at'; END IF; RAISE NOTICE 'OK admin dá baixa'; END$$;
DO $$BEGIN BEGIN UPDATE affiliate_commissions SET commission_cents=1 WHERE event_id='evt_m1'; RAISE 'FALHOU valor alterado'; EXCEPTION WHEN raise_exception THEN RAISE NOTICE 'OK valor da comissão é fixo'; END; END$$;
RESET ROLE;
