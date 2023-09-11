This FastAPI app runs on Python 3.10.11

All services are currently running on a docker compose cluster which has some implications with the development experience on the api backend (the react frontend, not so much).

# Database migrations

Right now, the postgis database is being populated with a few datasets via alembic migration. We are planning to decouple this eventually as standalone scripts, but for now you will need the [Nigeria schools and population](https://github.com/avsolatorio/worldex/files/12481827/nigeria-schools-and-population-density.zip) and Critical Habitat (download link to follow or ask any of the repo maintainers) datasets.

You will need to download them into the `/tmp/datasets/` directory of your host machine. Additionally, you will have to unzip the Nigeria datasets. You can leave the Critical Habitat zipfile as is.

## `just migrate-db`
to apply the database migrations. If you need to troubleshoot or would like a more fine-grained control, you can run
### docker compose exec -it api /bin/bash
to run a shell instance on the api service. Afterwards, you can issue your commands such as
### alembic upgrade head
which is exactly what `just migrate-db` does.

# API development

The api codebase currently hot reloads, so any changes you make should reflect immediately. However, the dependencies are baked in on the docker image.

## Using poetry

You will still use the `poetry` command on your host machine to add/remove dependencies, but the docker image (and container) only interacts with the `poetry.lock` and `pyproject.toml`. Which means you'll have to rebuild the image when dependencies are added.

This is admittedly added toil when compared to ui where the `node_modules` can be bind-mounted and thus `yarn add` commands can be issued from the host.

Unfortunately, the same cannot be done for the poetry-managed `virtualenv`. You will encounter ownership/permission issues if you try to run `poetry` commands from the host for a bind-mounted virtualenv. So we're not doing it unless we find a workaround.
