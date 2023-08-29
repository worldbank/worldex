from os import getenv

from dotenv import load_dotenv

from app.config import Settings

# TODO: use docker-compose env instead?
load_dotenv(getenv("ENV_FILE"))

settings = Settings()
