FROM imresamu/postgis-arm64:15-master-ver20231021-6f17cba-2023w44

RUN apt-get update && \
    apt-get install -y software-properties-common gcc make cmake python-dev-is-python3 python3-pip \
    libpq-dev postgresql-server-dev-15

RUN apt-get install -y pipx && \
    python3 -m pipx ensurepath && \
    pipx install pgxnclient

ENV PATH="/root/.local/bin:$PATH"
RUN pgxn install h3

RUN mkdir -p /docker-entrypoint-initdb.d
COPY ./initdb-extensions.sh /docker-entrypoint-initdb.d/extensions.sh
