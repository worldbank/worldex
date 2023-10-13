# WorldEx

WorldEx is designed to make subnational data discoverable using H3 indexing. Geocoders are implemented that are responsible for handling geospatial data types and converting them into H3 indices.

The project consists of a web application that allows for users to explore the available data at a given H3 cell. Users can search for names of places, which are processed using OpenStreetMap's Nominatim service.

APIs are implemented to allow users to interact with the indexed data.

# Local Development

First off, install [`just`](https://github.com/casey/just#installation). It is similar to `make` in that it's just a convenient wrapper around some cli commands to setup the local environment.

## `cd secrets && poetry install`
to setup the simple password generator.

## `just prep-aws-env`
to setup aws environment variables (including credentials) for dataset seeding later. This will create a `./secrets/aws.env` file. However, without secret manager you'll have to fill the aws key id and secret manually.

Ask the repo maintainers if you're part of the same team.

<span style="color:red">If you're on a Mac,</span> you may have to run the following first to enable `envsubst`

```
brew install gettext
brew link --force gettext 
```

## `just refresh-db-password`
to generate a postgres password and the environment files to be used by the `api`, `db`, and `pgweb` services as per the docker compose spec.

If you've previously generated a postgres password with this command and just want to regenerate the environment files, run `create-envs`

## `docker compose up`

to run the development environment on local. Simply interrupt to stop the cluster or `docker compose down` if you ran it in detached mode.

## API service
The api (and database) service are not quite ready yet at this point. See the API [readme](api/README.md) to finish setting them up.

## Pre-commit

is used to minimize nitpicking stemming from formatting and other minor issues during code review.

### `pip install pre-commit`

to install pre-commit. Alternatively, see https://pre-commit.com/ for installation instructions.

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
