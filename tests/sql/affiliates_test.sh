#!/usr/bin/env bash
# Executa a 0010 num Postgres local descartável. Nunca conecta ao banco real.
set -e; cd "$(dirname "$0")/../.."
tests/sql/run_local_pg.sh
LOCAL_PG_UID=$(id -u nobody 2>/dev/null || id -u lovable)
LOCAL_PG_GID=$(id -g nobody 2>/dev/null || id -g lovable)
trap 'setpriv --reuid="$LOCAL_PG_UID" --regid="$LOCAL_PG_GID" --clear-groups pg_ctl -D /tmp/pgtest/data stop -m fast >/dev/null' EXIT
P="env -u PGHOST -u PGPASSWORD -u PGUSER -u PGDATABASE -u PGPORT psql -q -v ON_ERROR_STOP=1 -h /tmp/pgtest -p 55432 -U postgres -d postgres"
$P -f tests/sql/supabase_stub.sql
$P -f drizzle/migrations/0010_affiliates.sql
$P -f tests/sql/affiliates_test.sql
$P -f tests/sql/affiliate_self_access_test.sql
$P -f drizzle/pending/0010_affiliates.rollback.sql && echo "OK reversão aplicada sem erro"
