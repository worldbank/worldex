PROJECT_NAME='Worldex API (local)'
VERSION=0.1.0
DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}/${POSTGRES_DB_NAME}
DATABASE_URL_SYNC=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}/${POSTGRES_DB_NAME}
ELASTICSEARCH_URL_SYNC=http://elastic:${ELASTIC_PASSWORD}@localhost:9200
ALLOW_ORIGINS=http://localhost:4173,http://w1lxscirender01.worldbank.org:4173,http://worldex-417100.uc.r.appspot.com,worldex-417100.uc.r.appspot.com