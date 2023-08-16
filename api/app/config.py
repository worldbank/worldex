from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    project_name: str
    version: str
    db_async_connection: str
