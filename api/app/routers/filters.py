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
    result = await session.execute(select(func.distinct(Dataset.source_org)))
    return result.scalars().all()
