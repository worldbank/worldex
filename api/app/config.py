from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    project_name: str
    version: str
    postgres_host: str
    postgres_db_name: str
    postgres_user: str
    postgres_password: str
    postgres_echo_query: bool = False
