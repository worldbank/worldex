# WorldEx

WorldEx is designed to make subnational data discoverable using H3 indexing. Geocoders are implemented that are responsible for handling geospatial data types and converting them into H3 indices.

The project consists of a web application that allows for users to explore the available data at a given H3 cell. Users can search for names of places, which are processed using OpenStreetMap's Nominatim service.

APIs are implemented to allow users to interact with the indexed data.

## Local Development

First, install [`just`](https://github.com/casey/just#installation). It is similar to `make` in that it's just a convenient wrapper around lengthier cli commands to setup the local environment.

### `cd secrets && poetry install`
to setup the simple password generator.

### `just prep-aws-env`
to setup aws environment variables (credentials, etc.) to access parquet files for dataset seeding later. This will create a `./secrets/aws.env` file. At the time of writing however, you'll have to fill the aws key id and secret manually.

Ask the repo maintainers if you're part of the same team. Eventually, these parquet files should be made publicly accessible.

<span style="color:red">If you're on a Mac,</span> you may have to run the following first to enable `envsubst`

```
brew install gettext
brew link --force gettext
```

### `just generate-es-password`
to generate a password to the `elastic` user of the `es` elasticsearch service

### `just refresh-db-password`
to generate a postgres password and the environment files to be used by the `api`, `db`, and `pgweb` services as per the docker compose spec.

If you've previously generated a postgres password with this command and just want to regenerate the environment files, run `create-envs`

### PostGIS on ARM-based devices
If you are on an ARM-based device (e.g. M1/M2 MacBooks), comment out the following line under the `db` service on `docker-compose.yaml`
```
dockerfile: arm64.Dockerfile
```
This PostGIS build will be more performant on your local machine.

### `docker compose up -d`

to run the development environment on local. `docker compose down` to stop it.

Note that the cluster doesn't include the vite app by default. You'll have to run `yarn` to install the dependencies and

### `yarn start`

to run the dev server. We exclude the vite app since `node_modules` cannot be bind-mount if the dependencies were installed on a different architecture (e.g. mac host, linux container).

You may need to `--force` if you encounter issues with the lockfile.

If you're outside of development context that requires hot reloads, you can run the following to run/test actual builds of the vite app.

### `docker compose --profile preview up -d`

will run `vite preview` to preview the production build (not actually intended as a production server)

### `docker compose --profile web up -d`

will run an nginx reverse proxy serving the vite app build.

## API service
See the API [readme](api/README.md) to finish setting the api (along with the database) service up.

## Elasticsearch
We use this service to search against dataset metadata. After populating your database with the pre-indexed datasets, from the `/api` directory run

```
just run-script es_index_dataset
```

You can use https://elasticvue.com/ as a gui to the elasticsearch service/indices - the browser extension is sufficient. You will have to provide the uri http://localhost:9200 and the generated credentials to connect to the cluster.

## Pre-commit

is used to minimize nitpicks such as formatting during code review.

### `pip install pre-commit`

to install pre-commit. Or see https://pre-commit.com/ for installation instructions.

### `pre-commit install`

to then setup the pre-commit hooks.

## Worldex package

### Installing poetry

```
pip install poetry
poetry install
```

### Running tests

```
poetry run python -m pytest
```
