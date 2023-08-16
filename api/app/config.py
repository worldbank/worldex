from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    project_name: str
    db_async_connection: str