"""Provider for basic datasets
"""
from datetime import datetime
from typing import Optional

import pandas as pd
from pydantic import BaseModel
from shapely import wkt
from shapely.geometry import box

from ..handlers.vector_handlers import VectorHandler
from ..utils.filemanager import create_staging_dir


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
    data_format: Optional[str] = None
    projection: Optional[str] = None
    properties: dict
    bbox: Optional[str] = None
    keywords: list[str]

    def index_from_gdf(self, gdf, dir=None):
        with create_staging_dir(dir) as (staging_dir, is_tempdir):
            handler = VectorHandler(gdf)
            h3indices = handler.h3index()
            self.bbox = wkt.dumps(box(*handler.bbox))
            df = pd.DataFrame({"h3_index": h3indices})
            df.to_parquet(staging_dir / "h3.parquet", index=False)
            with open(staging_dir / "metadata.json", "w") as f:
                f.write(self.model_dump_json())
        return df
