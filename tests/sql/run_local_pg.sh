#!/usr/bin/env bash
# Sobe um Postgres local descartável (porta 55432) em /tmp/pgtest. Não toca no banco real.
set -e
D=/tmp/pgtest; rm -rf $D; mkdir -p $D; chown 65534:65534 $D
AS="setpriv --reuid=65534 --regid=65534 --clear-groups env HOME=$D"
$AS initdb -D $D/data -U postgres -A trust >/dev/null
$AS pg_ctl -D $D/data -o "-p 55432 -k $D -c listen_addresses=''" -l $D/log -w start >/dev/null
echo "local pg up"
