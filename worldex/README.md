# Worldex

## Installation

```
poetry install --with dev,docs --all-extras
```

or

```
cd path/to/repo/worldex
poetry build
cd -
pip install 'path/to/repo/worldex/dist/worldex-0.0.1-py3-none-any.whl[wordlpop,hdx]'
```

## Docs

```bash
poetry run mkdocs serve
```
