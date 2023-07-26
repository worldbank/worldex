#!/bin/sh

(
    echo "Loading h3 extension"
    pgxn load h3
    psql -U $POSTGRES_USER -W $POSTGRES_PASSWORD -c 'CREATE EXTENSION IF NOT EXISTS h3_postgis CASCADE';
)