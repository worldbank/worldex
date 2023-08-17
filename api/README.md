This FastAPI app runs on Python 3.10.11

If you wish to run this app locally outside of docker-compose for whatever reason, I recommend the use of [pyenv](https://github.com/pyenv/pyenv) to switch Python versions.

From within the project or api root
```
pyenv install 3.10.11
pyenv local 3.10.11
```

## `poetry install`
to install dependencies inside a poetry virtual environment

When running commands within the api context such as `alembic` you can either prepend your commands with `poetry run <command>` or activate the poetry virtualenv first with `poetry shell`

## `alembic upgrade head`

To initialize the database tables.

### Caveat

Note that one of the migrations `populate_with_dummy_h3_data` assumes you have the file `/data/datagov/crithab_all_layers.zip` existing.

This migration is included for testing/development purposes. If you wish to skip it, there is a workaround:

- Make sure you have applied the preceding migration `be3aa22`
- Run `alembic stamp ca8c396` to mark it as "applied" without actually running it.