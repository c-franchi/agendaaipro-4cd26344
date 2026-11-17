#!/usr/bin/env bash
# Executa a 0009 num Postgres local descartável. Nunca conecta ao banco real.
set -e; cd "$(dirname "$0")/../.."
tests/sql/run_local_pg.sh
P="env -u PGHOST -u PGPASSWORD -u PGUSER -u PGDATABASE -u PGPORT psql -q -v ON_ERROR_STOP=1 -h /tmp/pgtest -p 55432 -U postgres -d postgres"
$P -f tests/sql/supabase_stub.sql
$P -c "CREATE TABLE public.order_assets(order_id uuid)"
$P -f drizzle/migrations/0007_templates_and_installations.sql
$P -f drizzle/migrations/0008_deployment_files_customization_audit.sql
$P -f drizzle/pending/0009_deployments_hardening.sql
$P -f tests/sql/deployments_hardening_test.sql
# concorrência: dois pedidos de criação simultâneos para o mesmo pedido
$P -c "INSERT INTO business_orders(id,user_id,module_plan) VALUES ('10000000-0000-0000-0000-000000000002',gen_random_uuid(),'agenda')"
Q="BEGIN; INSERT INTO system_installations(order_id,template_id,contracted_plan) SELECT '10000000-0000-0000-0000-000000000002',id,'' FROM system_templates; SELECT pg_sleep(1); COMMIT;"
($P -c "$Q" >/tmp/pgtest/c1 2>&1; echo $? >>/tmp/pgtest/c1) & ($P -c "$Q" >/tmp/pgtest/c2 2>&1; echo $? >>/tmp/pgtest/c2) & wait
N=$($P -Atc "select count(*) from system_installations where order_id='10000000-0000-0000-0000-000000000002'")
cat /tmp/pgtest/c1 /tmp/pgtest/c2 | grep -i -E 'duplicate|^[01]$' || true
[ "$N" = "1" ] && echo "OK concorrência: 1 implantação criada de 2 tentativas simultâneas" || { echo "FALHOU concorrência: $N"; exit 1; }
# reversão aplica limpa
$P -f drizzle/pending/0009_deployments_hardening.rollback.sql && echo "OK reversão aplicada sem erro"
setpriv --reuid=65534 --regid=65534 --clear-groups pg_ctl -D /tmp/pgtest/data stop -m fast >/dev/null
