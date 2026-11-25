#!/usr/bin/env bash
# Executa a 0010 num Postgres local descartável. Nunca conecta ao banco real.
set -e; cd "$(dirname "$0")/../.."
tests/sql/run_local_pg.sh
P="env -u PGHOST -u PGPASSWORD -u PGUSER -u PGDATABASE -u PGPORT psql -q -v ON_ERROR_STOP=1 -h /tmp/pgtest -p 55432 -U postgres -d postgres"
$P -f tests/sql/supabase_stub.sql
$P -f drizzle/pending/0010_affiliates.sql
$P -f tests/sql/affiliates_test.sql
$P -f drizzle/pending/0010_affiliates.rollback.sql && echo "OK reversão aplicada sem erro"
setpriv --reuid=65534 --regid=65534 --clear-groups pg_ctl -D /tmp/pgtest/data stop -m fast >/dev/null
