FROM postgis/postgis:15-3.3

RUN apt-get update && \
    apt-get install -y software-properties-common gcc make python-dev python3-pip \
    libpq-dev postgresql-server-dev-15 && \
    pip install cmake pgxnclient

RUN pgxn install h3

RUN mkdir -p /docker-entrypoint-initdb.d
COPY ./initdb-extensions.sh /docker-entrypoint-initdb.d/extensions.sh