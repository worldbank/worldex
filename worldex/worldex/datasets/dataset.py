"""Provider for basic datasets
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BaseDataset(BaseModel):
    """Base datasets

    TODO: add validation
    TODO: h3 file
    """

    name: str
    source_org: str
    last_fetched: datetime
    files: list[str]
    description: str
    data_format: str
    projection: str
    properties: dict
    bbox: Optional[str] = None
    keywords: list[str]
