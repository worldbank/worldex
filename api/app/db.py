# from databases import Database
from sqlalchemy.ext.declarative import declarative_base

from app import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession


async_engine = create_async_engine(
    settings.database_url, echo=settings.database_echo_query, future=True
)


async def get_async_session() -> AsyncSession:
    async_session = sessionmaker(
        bind=async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


Base = declarative_base()
