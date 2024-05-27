import os
from typing import List
from datetime import datetime
from app.document import DatasetFacetedSearch
from elasticsearch_dsl import connections


ELASTICSEARCH_CONNECTION = os.getenv("ELASTICSEARCH_URL_SYNC")
connections.create_connection(
    hosts=[ELASTICSEARCH_CONNECTION],
    verify_certs=False,
)


def keyword_search(
    query: str,
    source_org: List[str] = None,
    accessibility: List[str] = None,
    projection: List[str] = None,
    min_year: int = None,
    max_year: int = None,
    from_result: int = 0,
    size: int = 10,
):
    '''This endpoint provides the service for the keyword search functionality. This uses Elasticsearch in the backend for the full-text search.
    '''

    filters = dict(
        source_org=source_org or [],
        accessibility=accessibility or [],
        projection=projection or []
    )

    if min_year:
        if max_year:
            filters["year"] = [datetime(y, 1, 1)
                               for y in range(min_year, max_year + 1)]
            filters["year"] = [datetime(y, 1, 1)
                               for y in range(min_year, max_year + 1)]
        else:
            filters["year"] = [datetime(y, 1, 1)
                               for y in range(min_year, datetime.now().year + 1)]
    elif max_year:
        filters["year"] = [datetime(y, 1, 1)
                            for y in range(max_year - 20, max_year + 1)]

    # Rename the year filter to date_start and date_end
    if "year" in filters:
        filters["date_start"] = filters.pop("year")
        filters["date_end"] = filters["date_start"]

    fs = DatasetFacetedSearch(query=query, filters=filters)

    response = fs[from_result: from_result + size].execute()

    total = response.hits.total.to_dict()
    total["message"] = total["value"]

    hits = []
    result = []
    highlights = []
    facets = response.aggregations.to_dict()

    for ix, h in enumerate(response, 1):
        highlight = {}
        hits.append(h.to_dict())
        result.append(dict(id=h.meta.id, rank=ix +
                      from_result, score=h.meta.score))
        try:
            highlight = h.meta.highlight.to_dict()
        except AttributeError:
            # 'HitMeta' object has no attribute 'highlight'
            highlight["body"] = []

        highlight["id"] = h.meta.id
        highlights.append(highlight)

    filters["min_year"] = min_year
    filters["max_year"] = max_year

    return dict(
        total=total,
        hits=hits,
        result=result,
        highlights=highlights,
        facets=facets,
        filters=filters,
        next=from_result + size
    )
