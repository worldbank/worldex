# Installation

## Basic

For the most barebones version of worldex

```bash
pip install worldex
```

If you need data providers parsers you can install the optional dependencies

```bash
pip install 'worldex[hdx,worldpop]'
```

## Development and contribution

For development, we use poetry to manage our python dependencies.

```
git clone https://github.com/avsolatorio/worldex
cd worldex/worldex
pip install poetry
poetry install --all --all-extras
```

### Tests

To run the test suite, run the following

```
poetry run pytest -m tests/
```

### Docs

To run docs, run the following

```
poetry run mkdocs serve
```

#### For publishing

To publish the python package,

```
poetry config pypi-token.pypi $API_TOKEN set api token
poetry version $VERSION # bumps the version
poetry publish --build
```
