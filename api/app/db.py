# from databases import Database
from sqlalchemy.ext.declarative import declarative_base

from app import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

# TODO: turn off echo outside of dev environments
user = settings.postgres_user
pwd = settings.postgres_password
host = settings.postgres_host
db_name = settings.postgres_db_name
postgres_async_connection = f"postgresql+asyncpg://{user}:{pwd}@{host}/{db_name}"
async_engine = create_async_engine(
    postgres_async_connection, echo=settings.postgres_echo_query, future=True
)


async def get_async_session() -> AsyncSession:
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


Base = declarative_base()
