@generate-password:
  cd secrets && poetry run ./generate_password.py
@generate-db-password:
  just generate-password | xargs -I {} echo "POSTGRES_PASSWORD={}" > ./secrets/postgres_password.env
api-shell:
  docker compose exec -it api /bin/bash
prep-aws-env:
  envsubst < ./secrets/aws.env.tpl > ./secrets/aws.env
create-envs:
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/pgweb.env.tpl > ./secrets/pgweb.env
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/api.env.tpl > ./secrets/api.env
  env $(cat ./secrets/db.env | xargs) envsubst < ./secrets/api.envrc.tpl > ./api/.envrc.part
  awk -F= '{print "export " $0}' ./api/.envrc.part > ./api/.envrc
  rm ./api/.envrc.part
  awk -F= '{print "export " $0}' ./secrets/aws.env >> ./api/.envrc
refresh-db-password:
  just generate-password | xargs -I {} env PASSWORD={} bash -c 'cat ./secrets/db.env.tpl | envsubst'  > ./secrets/db.env
  just create-envs
