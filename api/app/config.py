from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str
    version: str
    database_url: str
    database_echo_query: bool = False
    allow_origins: str
    # disable by default
    openapi_url: str = ""
