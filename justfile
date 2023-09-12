@generate-password:
  cd secrets && poetry run ./generate_password.py
@generate-db-password:
  just generate-password | xargs -I {} echo "POSTGRES_PASSWORD={}" > ./secrets/postgres_password.env
migrate-db:
  docker compose exec -it api alembic upgrade head
create-envs:
  just generate-password | xargs -I {} env PASSWORD={} bash -c 'cat ./secrets/db.env.tpl | envsubst'  > ./secrets/db.env
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/pgweb.env.tpl > ./secrets/pgweb.env
