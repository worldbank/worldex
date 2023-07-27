#!/bin/sh

(
    echo "Loading h3 extension"
    psql -d $POSTGRES_DB -U $POSTGRES_USER -W $POSTGRES_PASSWORD -c 'CREATE EXTENSION IF NOT EXISTS h3_postgis CASCADE;'
    pgxn load -d $POSTGRES_DB -U $POSTGRES_USER h3
)