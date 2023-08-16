FROM python:3.10.11-alpine as python-base

ENV POETRY_VERSION=1.5.1
ENV POETRY_HOME=/opt/poetry
ENV POETRY_VENV=/opt/poetry-venv

ENV POETRY_CACHE_DIR=/opt/.cache

FROM python-base as poetry-base

RUN apk add gcc python3-dev \
    && python3 -m venv $POETRY_VENV \
    && $POETRY_VENV/bin/pip install -U pip setuptools \
    && $POETRY_VENV/bin/pip install poetry==${POETRY_VERSION}

FROM poetry-base as worldex-api

COPY --from=poetry-base ${POETRY_VENV} ${POETRY_VENV}

ENV PATH="${PATH}:${POETRY_VENV}/bin"

WORKDIR /code
COPY poetry.lock pyproject.toml ./

RUN poetry check
RUN poetry install --no-interaction --no-cache

COPY ./ /code

EXPOSE 8000
CMD ["poetry", "run", "python", "main.py"]
