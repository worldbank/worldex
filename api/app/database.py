from databases import Database
from sqlalchemy.ext.declarative import declarative_base

# TODO: get from settings
database = Database("postgresql+asyncpg://worldex:postgres@db/worldex")

Base = declarative_base()