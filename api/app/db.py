# from databases import Database
from sqlalchemy.ext.declarative import declarative_base

from app import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

async_engine = create_async_engine(
    settings.db_async_connection,
    echo=True,
    future=True
)

async def get_async_session() -> AsyncSession:
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


# TODO: decommission in favor of sqlalchemy?
# database = Database("postgresql+asyncpg://worldex:postgres@db/worldex")

Base = declarative_base()