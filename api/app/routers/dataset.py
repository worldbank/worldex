from app import settings
from app.db import get_async_session
from app.models import (
    Dataset,
    DatasetCountRequest,
    DatasetCountTile,
    DatasetMetadataRequest,
    DatasetRequest,
    DatasetsByLocationRequest,
)
from app.services import (
    dataset_count_to_bytes,
    get_dataset_count_tiles_async,
    get_dataset_metadata_results,
)
from app.sql.bounds_fill import FILL, FILL_RES2
from app.sql.dataset_coverage import DATASET_COVERAGE
from app.sql.datasets_by_location import (
    DATASETS_BY_LOCATION,
    LOCATION_FILL,
    LOCATION_FILL_RES2,
)
from fastapi import APIRouter, Depends, Response
from shapely import wkt
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(
    tags=["dataset"]
)

@router.post("/dataset_counts/{z}/{x}/{y}")
async def get_dataset_counts(
    payload: DatasetCountRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    filters = {}
    if payload.source_org:
        filters["source_org"] = payload.source_org
    location = payload.location
    should_hit_cache = not (payload.ignore_cache or location or filters)
    cached_tile = None
    if should_hit_cache:
        cached_tile = await session.execute(
            select(DatasetCountTile.dataset_counts).where(
                DatasetCountTile.z == z,
                DatasetCountTile.x == x,
                DatasetCountTile.y == y,
            )
        )
    header_kwargs = {}
    if cached_tile:
        dataset_count_bytes = cached_tile.scalar()
        header_kwargs = {"headers": {"X-Tile-Cache-Hit": "true"}}
    else:
        resolution = payload.resolution
        results = await get_dataset_count_tiles_async(session, z, x, y, resolution, location, filters)
        if payload.debug_json_response:
            return [row._mapping for row in results]
        dataset_counts = {'index': [], 'dataset_count': []}

        for row in results:
            mapping = row._mapping
            dataset_counts['index'].append(mapping.index)
            dataset_counts['dataset_count'].append(mapping.dataset_count)
        dataset_count_bytes = dataset_count_to_bytes(dataset_counts)
        if should_hit_cache:
            async with session:
                dataset_count_tile = DatasetCountTile(
                    z=z,
                    x=x,
                    y=y,
                    dataset_counts=dataset_count_bytes,
                )
                session.add(dataset_count_tile)
                await session.commit()
    return Response(
        content=dataset_count_bytes, media_type="application/octet-stream", **header_kwargs
    )


@router.post("/dataset_coverage/{z}/{x}/{y}")
async def get_dataset_coverage(
    payload: DatasetRequest,
    z: int,
    x: int,
    y: int,
    session: AsyncSession = Depends(get_async_session),
):
    resolution = payload.resolution
    location = payload.location
    query = DATASET_COVERAGE.format(fill_query=FILL_RES2 if resolution == 2 else FILL)
    query = text(query).bindparams(z=z, x=x, y=y, location=location, resolution=resolution, dataset_id=payload.dataset_id)
    results = await session.execute(query)
    return [row[0] for row in results.fetchall()]


@router.post("/dataset_count/")
async def get_dataset_count(
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(select(func.count(Dataset.id)))
    return {"dataset_count": result.scalar_one()}


@router.post("/datasets_by_location/")
async def get_datasets_by_location(
    payload: DatasetsByLocationRequest,
    session: AsyncSession = Depends(get_async_session),
):
    location = payload.location
    resolution = payload.resolution
    parents_array = ["fill_index"] + [
        f"h3_cell_to_parent(fill_index, {res})" for res in range(0, resolution)
    ]
    parents_comma_delimited = ", ".join(parents_array)
    query = DATASETS_BY_LOCATION.format(
        parents_array=parents_comma_delimited,
        fill_query=LOCATION_FILL_RES2 if resolution == 2 else LOCATION_FILL
    )
    query = text(query).bindparams(location=location, resolution=resolution)
    results = await session.execute(query)
    return [
        dict(
            row._mapping,
            bbox=wkt.loads(row._mapping['bbox']).bounds
        )
        for row in results.fetchall()
    ]


@router.post("/dataset_metadata/{index}")
async def get_dataset_metadata(
    index: str,
    payload: DatasetMetadataRequest,
    session: AsyncSession = Depends(get_async_session),
):
    filters={}
    if payload.source_org:
        filters["source_org"] = payload.source_org
    results = await get_dataset_metadata_results(session, target=index, filters=filters)
    return [
        dict(
            row._mapping,
            bbox=wkt.loads(row._mapping['bbox']).bounds
        )
        for row in results
    ]
