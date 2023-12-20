"""
Automates indexing of hdx datasets
"""
import os
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path

import pandas as pd
from hdx.data.dataset import Dataset
from shapely import wkt
from shapely.geometry import box

from ..handlers.raster_handlers import RasterHandler
from ..handlers.vector_handlers import VectorHandler
from ..utils.filemanager import unzip_file
from .dataset import BaseDataset

VALID_TYPES = ["CSV", "Geopackage", "SHP"]

PRIORITY = [
    "Geopackage",
    "GeoJSON",
    "SHP",
    "GeoTIFF",
    "CSV",
]


class HDXDataset(BaseDataset):
    """
    Usage:

    >>> dataset = HDXDataset.from_url("https://data.humdata.org/dataset/openbuildings_morocco_earthquake_footprint")
    >>> dataset.index(dir="output/directory/")
    """

    source_org: str = "HDX"

    @classmethod
    def from_url(cls, url: str):
        # TODO: catch malformed url
        id = url.replace("https://data.humdata.org/dataset/", "")
        return cls.from_id(id)

    @classmethod
    def from_id(cls, id: str):
        dataset = Dataset.read_from_hdx(id)
        return cls.from_hdx_dataset(dataset)

    @classmethod
    def from_hdx_dataset(cls, dataset: Dataset):
        if not dataset["has_geodata"]:
            raise Exception("No geodata found for this data")
        files = [r["download_url"] for r in dataset.resources]
        obj = cls(
            name=dataset["title"],
            last_fetched=datetime.now().isoformat(),
            files=files,
            data_format="",
            description=dataset["notes"],
            projection="",
            url=f"https://data.humdata.org/dataset/{dataset['name']}",
            properties={
                "original_source": dataset["dataset_source"],
            },
            keywords=[],
            accessibility="public/open",
        )
        # TODO: figure out a better way of keeping this
        obj._dataset = dataset
        return obj

    def index(self):
        resources = self._dataset.resources
        sorted_resources = sorted(
            filter(
                lambda x: x["format"] in PRIORITY and not x.get("broken_link", False),
                resources,
            ),
            key=lambda x: PRIORITY.index(x["format"]),
        )
        if len(sorted_resources) == 0:
            raise Exception("Could not find a valid type")
        resource = sorted_resources[0]
        filename = Path(resource["download_url"]).name

        # Skip downloading if file exists in dir
        file_path = self.dir / filename
        if not os.path.exists(file_path):
            _, temp_filename = resource.download(self.dir)
            if temp_filename != file_path:
                # hdx has a weird filenaming when downloading files as it append file extensions.
                # it becomes file.shp.zip.shp this addresses by handling the renaming
                os.rename(temp_filename, self.dir / filename)
        # TODO: Figure out how to handle zipped files
        if "GeoTIFF" == resource["format"]:
            if file_path.name.endswith(".zip"):
                unzipped_files = unzip_file(file_path, self.dir)
                file = list(filter(lambda f: f.name.endswith(".tif"), unzipped_files))
                if len(file) > 0:
                    handler = RasterHandler.from_file(file[0])
                else:
                    raise Exception("Could not find a valid type")
            else:
                handler = RasterHandler.from_file(file_path)
        else:
            # Logic for nested dir inside zip
            files = zipfile.ZipFile(file_path).namelist()
            is_zipped_dir = all("/" in f for f in files)
            if file_path.name.endswith(".zip") and len(files) > is_zipped_dir:
                counter = Counter(Path(f).parent.name for f in files)
                folder = counter.most_common()[0][0]
                if counter[folder] > 1:
                    handler = VectorHandler.from_file(f"{str(file_path)}!{folder}")
                else:
                    handler = VectorHandler.from_file(file_path)
            else:
                handler = VectorHandler.from_file(file_path)
        h3indices = handler.h3index()
        self.bbox = wkt.dumps(box(*handler.bbox))
        df = pd.DataFrame({"h3_index": h3indices})
        self.write(df)
        return df
