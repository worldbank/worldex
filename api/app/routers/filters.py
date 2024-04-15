from app.db import get_async_session
from app.models import Dataset
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    prefix="/filters",
    tags=["filters"]
)

@router.get("/source_org")
async def get_source_orgs(
    session: AsyncSession = Depends(get_async_session)
):
    stmt = select(func.distinct(Dataset.source_org))
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/accessibility")
async def get_accessibility(
    session: AsyncSession = Depends(get_async_session)
):
    stmt =  select(func.distinct(Dataset.accessibility))
    result = await session.execute(stmt)
    accessibilities = [a11y for a11y in result.scalars().all() if a11y is not None]
    accessibilities += ["Others"]
    return accessibilities
