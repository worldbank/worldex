import pandas as pd
from shapely import wkt
from shapely.geometry import box
from shapely.ops import unary_union

from worldex.datasets.dataset import BaseDataset
from worldex.handlers.vector_handlers import VectorHandler
from worldex.utils.filemanager import download_file


class UNHCRDataset(BaseDataset):
    """
    Usage:
    """

    source_org: str = "UNHCR"
    _home_url: str = "https://data.unhcr.org"

    def download(self):
        for file in self.files:
            download_file(file, self.dir / "data.geojson")

    def index(self, window=(10, 10)):
        self.download()
        boxes = []
        indices = []
        shp_files = list(self.dir.glob("**/*.geojson"))
        for file in shp_files:
            handler = VectorHandler.from_file(file)
            h3indices = handler.h3index()
            boxes.append(box(*handler.bbox))
            indices.append(pd.DataFrame({"h3_index": h3indices}))
        self.bbox = wkt.dumps(box(*unary_union(boxes).bounds))
        df = pd.concat(indices).drop_duplicates()
        self.write(df)
        return df
