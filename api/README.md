This FastAPI app runs on Python 3.10.11

If you wish to run this app locally outside of docker-compose for whatever reason, I recommend the use of [pyenv](https://github.com/pyenv/pyenv) to switch Python versions.

From within the project or api root
```
pyenv install 3.10.11
pyenv local 3.10.11
```

# `poetry install`
to install dependencies inside a poetry virtual environment

When running commands within the api context such as `alembic` tou can either prepend your commands with `poetry run <command>` or activate the poetry virtualenv first with `poetry shell`