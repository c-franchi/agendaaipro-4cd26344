#!/usr/bin/env bash
# Sobe um Postgres local descartável (porta 55432) em /tmp/pgtest. Não toca no banco real.
set -e
D=/tmp/pgtest; rm -rf $D; mkdir -p $D
LOCAL_PG_UID=$(id -u nobody 2>/dev/null || id -u lovable)
LOCAL_PG_GID=$(id -g nobody 2>/dev/null || id -g lovable)
chown "$LOCAL_PG_UID:$LOCAL_PG_GID" $D
AS="setpriv --reuid=$LOCAL_PG_UID --regid=$LOCAL_PG_GID --clear-groups env HOME=$D"
$AS initdb -D $D/data -U postgres -A trust >/dev/null
$AS pg_ctl -D $D/data -o "-p 55432 -k $D -c listen_addresses=''" -l $D/log -w start >/dev/null
echo "local pg up"
