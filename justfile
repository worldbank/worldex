@generate-password:
  cd secrets && poetry run ./generate_password.py
@generate-db-password:
  just generate-password | xargs -I {} echo "POSTGRES_PASSWORD={}" > ./secrets/postgres_password.env
api-shell:
  docker compose exec -it api /bin/bash
migrate-db:
  docker compose exec -it api alembic upgrade head
create-envs:
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/pgweb.env.tpl > ./secrets/pgweb.env
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/api.env.tpl > ./secrets/api.env
  awk -F= '{print "export " $0}' ./secrets/api.env > ./api/.envrc
create-envs-w-new-password:
  just generate-password | xargs -I {} env PASSWORD={} bash -c 'cat ./secrets/db.env.tpl | envsubst'  > ./secrets/db.env
  just create-envs
