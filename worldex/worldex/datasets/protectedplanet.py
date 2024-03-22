import os
from pathlib import Path

import pandas as pd
from pyunpack import Archive
from shapely import wkt
from shapely.geometry import box
from shapely.ops import unary_union

from worldex.datasets.dataset import BaseDataset
from worldex.handlers.vector_handlers import VectorHandler
from worldex.utils.filemanager import download_file


class ProtectedPlanetDataset(BaseDataset):

    source_org: str = "Protected Planet"

    def unzip(self):
        """Unzip all files"""
        for file in filter(
            lambda x: x.endswith(".zip") or x.endswith(".7z"), self.files
        ):
            filename = Path(file).name
            Archive(self.dir / filename).extractall(self.dir)

    def download(self):
        for file in self.files:
            filename = Path(file).name
            if not os.path.exists(self.dir / filename):
                download_file(file, self.dir / filename)

    def index(self):
        self.download()
        self.unzip()
        self.unzip()
        boxes = []
        indices = []
        shp_files = list(self.dir.glob("**/*_shp_*.zip"))
        for file in shp_files:
            handler = VectorHandler.from_file(file)
            h3indices = handler.h3index()
            boxes.append(box(*handler.bbox))
            indices.append(pd.DataFrame({"h3_index": h3indices}))
        self.bbox = wkt.dumps(box(*unary_union(boxes).bounds))
        df = pd.concat(indices).drop_duplicates()
        self.write(df)
        return df
