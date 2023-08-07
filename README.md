# WorldEx

WorldEx is designed to make subnational data discoverable using H3 indexing. Geocoders are implemented that are responsible for handling geospatial data types and converting them into H3 indices.

The project consists of a web application that allows for users to explore the available data at a given H3 cell. Users can search for names of places, which are processed using OpenStreetMap's Nominatim service.

APIs are implemented to allow users to interact with the indexed data.

# Local Development

## `docker compose up`

to run the development environment on local. Simply interrupt to stop the cluster or `docker compose down` if you ran it in detached mode.

## Pre-commit

is used to minimize nitpicking stemming from formatting and other minor issues during code review.

### `pip install pre-commit`

to install pre-commit. Alternatively, see https://pre-commit.com/ for installation instructions.

### `pre-commit install`

to then setup the pre-commit hooks.
