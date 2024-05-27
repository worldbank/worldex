from typing import Union
from fastapi import APIRouter
from fastapi import Query

from app.search.parser import parse_query


router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/parse")
def parse(query: Union[str, None] = None, labels: list[str] = Query(["year", "country", "statistical indicator", "region"], description="A set of labels for tagging segments of the query."), threshold: float = 0.3, nested_ner: bool = False):

    if query is None:
        return {"error": "Query parameter is required."}

    return parse_query(query, labels, threshold, nested_ner)
