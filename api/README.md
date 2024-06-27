This FastAPI app runs on Python 3.10.x

###  `poetry install --with handlers`

to create a poetry-managed virtualenv on your host machine. This is recommended so you don't have to `docker exec` a shell inside the fastapi container every time you want to issue  `alembic` commands or run scripts.

### Install [direnv](https://direnv.net/docs/installation.html)

first to load the necessary environment variables prior to running the commands below. Don't forget to [hook](https://direnv.net/docs/hook.html) it to your shell.

#### `direnv allow`
inside the `api` directory aftewrwards to load the variables from `.envrc`

## Populating the database

### The quick way

A pgdump of a small subset of currently indexed datasets can be downloaded from https://storage.googleapis.com/worldex-dump/worldex.dump <span style="color:red">*</span>

To restore, first make the dump accessible on your db container

```
docker compose cp worldex.dump db:worldex.dump
```

From inside the container (either via `docker compose exec -it db /bin/bash` or `docker compose db <command>` directly), run

```
pg_restore -U worldex -Fc -j 8 -d worldex worldex.dump -v
```

You can set the `-j` (`--jobs`) value to the number of cores on your CPU for starters. For more information, see the `number-of-jobs` section on https://www.postgresql.org/docs/current/app-pgrestore.html to know the appropriate value.

<span style="color:red">*</span> The database dump was generated with the following command

```
pg_dump -U worldex -d worldex -v -Fc -Z 0 --file=worldex.dump
```

### The long way

#### `just migrate-db`
from `/api` to apply the database migrations. The underlying command is

#### `alembic upgrade head`

which you can run manually from inside the `api` container after `docker compose exec -it api /bin/bash`.

#### Manually indexing the datasets

Many datasets from different source organizations (e.g. WorldPop, HDX, etc.) have been pre-indexed into parquet files and stored in an aws bucket.

To load these into your database, run either

```
just run-script <script filename>
```

or

```
poetry run python -m scripts.<script filename>
```

At the time of writing, these individual scripts are segregated by source organization and found in `api/scripts`

```
- index_hdx
- index_world_pop
- index_critical_habitat
```

## API development

The api container currently hot reloads, so changes to the code should reflect immediately. However, the dependencies are setup upon building the docker image. So whenever dependencies are added, you'll have to rebuild the image using

### `docker compose up api --build`

You will still use `poetry` from your host environment to add/remove dependencies on `poetry.lock` and `pyproject.toml`.

We do not bind-mount the poetry-managed `virtualenv` as it leads to ownership/permission issues if you try to run `poetry` commands from the host.

<details>
<summary>Load DB dump (archived)</summary>

This is useful for loading an sql dump to a postgresql instance. The dump is located at `/opt/datasets.sql` and can be loaded with the following commands:

```bash
# Install postgis deps
sudo apt-get install postgis postgresql-15-postgis-3

# Create the database
createdb public.datasets -U postgres

# Install postgis extension
psql -d public.datasets -c "CREATE EXTENSION IF NOT EXISTS postgis;" -U postgres

# Load the dump
psql -d public.datasets -f /opt/datasets.sql -U postgres
```
</details>
