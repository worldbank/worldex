"""Provider for basic datasets
"""
from datetime import datetime
from typing import Optional
from typing_extensions import Literal
from pathlib import Path

import pandas as pd
from pydantic import BaseModel
from shapely import wkt
from shapely.geometry import box

from ..handlers.vector_handlers import VectorHandler
from ..handlers.raster_handlers import RasterHandler
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
    date_start: Optional[datetime] = None
    date_end: Optional[datetime] = None
    accessibility: Optional[Literal["public/open", "public/login", "private"]] = None

    def set_dir(self, dir):
        self._dir = Path(dir)
        if not self._dir.exists() or not self._dir.is_dir():
            raise Exception(f"{dir} doest not exist or is not a directory")
        return self

    @property
    def dir(self):
        return self._dir

    def index_from_gdf(self, gdf):
        handler = VectorHandler(gdf)
        h3indices = handler.h3index()
        self.bbox = wkt.dumps(box(*handler.bbox))
        df = pd.DataFrame({"h3_index": h3indices})
        df.to_parquet(self.dir / "h3.parquet", index=False)
        with open(self.dir / "metadata.json", "w") as f:
            f.write(self.model_dump_json())
        return df

    def index_from_riosrc(self, src, window=None):
        handler = RasterHandler(src)
        h3indices = handler.h3index(window=None)
        self.bbox = wkt.dumps(box(*handler.bbox))
        df = pd.DataFrame({"h3_index": h3indices})
        df.to_parquet(self.dir / "h3.parquet", index=False)
        with open(self.dir / "metadata.json", "w") as f:
            f.write(self.model_dump_json())
        return df
