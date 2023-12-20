"""
Automates indexing of hdx datasets
"""
import os
from datetime import datetime
from pathlib import Path

import pandas as pd
from shapely import wkt
from shapely.geometry import box
from pyunpack import Archive
from shapely.ops import unary_union


from ..handlers.vector_handlers import VectorHandler
from ..utils.filemanager import download_file
from .dataset import BaseDataset

VALID_TYPES = ["CSV", "Geopackage", "SHP", "GeoJSON"]

PRIORITY = [
    "Geopackage",
    "GeoJSON",
    "SHP",
    "GeoTIFF",
    "CSV",
]


class EnergyInfoDataset(BaseDataset):
    source_org: str = "EnergyInfo"

    @staticmethod
    def get_range(dataset):
        start_date = dataset.get("start_date", None)
        if start_date:
            start_date = parser.parse(start_date)
            start_date = start_date.replace(month=1, day=1).date()
        else:
            start_date = None

        end_date = dataset.get("end_date", None)
        if end_date:
            end_date = parser.parse(end_date)
            end_date = end_date.replace(month=12, day=31).date()
        else:
            end_date = None
        return (start_date, end_date)

    @classmethod
    def from_dataset(cls, dataset):
        files = [r["url"] for r in dataset["resources"]]
        date_start, date_end = cls.get_range(dataset)
        obj = cls(
            name=dataset["title"],
            last_fetched=datetime.now().isoformat(),
            files=files,
            data_format="",
            description=dataset["notes"],
            projection="",
            url=f"https://energydata.info/dataset/{dataset['name']}",
            properties={"id": dataset["name"]},
            keywords=[],
            accessibility="public/open",
            date_start=date_start,
            date_end=date_end,
        )
        obj._dataset = dataset
        return obj

    def unzip(self):
        """Unzip all files"""
        for file in filter(
            lambda x: x.endswith(".zip") or x.endswith(".7z"), self.files
        ):
            filename = Path(file).name
            Archive(self.dir / filename).extractall(self.dir)

    def download(self):
        resources = self._dataset["resources"]
        for resource in resources:
            file = resource["url"]
            filename = Path(file).name
            if not os.path.exists(self.dir / filename):
                download_file(file, self.dir / filename)

    def index(self):
        self.download()
        self.unzip()
        boxes = []
        indices = []
        geo_files = (
            list(self.dir.glob("**/*.geojson"))
            + list(self.dir.glob("**/*.GEOJSON"))
            + list(self.dir.glob("**/*.shp"))
            + list(self.dir.glob("**/*.SHP"))
            + list(self.dir.glob("**/*.gpkg"))
            + list(self.dir.glob("**/*.GPKG"))
        )
        for file in filter(lambda file: "__MACOSX" not in str(file), geo_files):
            handler = VectorHandler.from_file(file)
            h3indices = handler.h3index()
            boxes.append(box(*handler.bbox))
            indices.append(pd.DataFrame({"h3_index": h3indices}))

        self.bbox = wkt.dumps(box(*unary_union(boxes).bounds))
        df = pd.concat(indices).drop_duplicates()
        self.write(df)
        return df
