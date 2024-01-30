import os
from pathlib import Path

import pandas as pd
from pyunpack import Archive
from shapely import wkt
from shapely.geometry import box
from shapely.ops import unary_union

from worldex.datasets.dataset import BaseDataset
from worldex.handlers.raster_handlers import RasterHandler
from worldex.handlers.vector_handlers import VectorHandler
from worldex.utils.filemanager import download_file


class WorldBankCatalogDataset(BaseDataset):
    """
    Usage:

    """

    source_org: str = "Worldbank"
    _home_url: str = "https://datacatalog.worldbank.org"

    def download(self):
        """Download all files"""
        for file in self.files:
            filename = Path(file.split("?")[0]).name
            if not os.path.exists(self.dir / filename):
                # TODO: https download is way slower than using worldpop ftp
                try:
                    download_file(file, self.dir / filename)
                except:
                    pass

    def unzip(self):
        """Unzip all files"""
        for file in filter(
            lambda x: x.endswith(".zip") or x.endswith(".7z"), self.files
        ):
            filename = Path(file).name
            Archive(self.dir / filename).extractall(self.dir)

    def index(self, window=(10, 10)):
        self.download()
        self.unzip()
        boxes = []
        indices = []
        # TODO: figure out a better way to handle this
        tif_files = (
            list(self.dir.glob("**/*.tif"))
            + list(self.dir.glob("**/*.TIF"))
            + list(self.dir.glob("**/*.tiff"))
            + list(self.dir.glob("**/*.TIFF"))
        )
        for file in tif_files:
            handler = RasterHandler.from_file(file)
            h3indices = handler.h3index(window=window)
            boxes.append(box(*handler.bbox))
            indices.append(pd.DataFrame({"h3_index": h3indices}))
        shp_files = (
            list(self.dir.glob("**/*.shp"))
            + list(self.dir.glob("**/*.SHP"))
            + list(self.dir.glob("**/*.geojson"))
        )
        for file in shp_files:
            handler = VectorHandler.from_file(file)
            h3indices = handler.h3index()
            boxes.append(box(*handler.bbox))
            indices.append(pd.DataFrame({"h3_index": h3indices}))
        self.bbox = wkt.dumps(box(*unary_union(boxes).bounds))
        df = pd.concat(indices).drop_duplicates()
        self.write(df)
        return df
