"""
Automates indexing of world pop datasets
"""
import os
from datetime import datetime

from hdx.data.dataset import Dataset
import pandas as pd
from shapely import wkt
from shapely.geometry import box


from .dataset import BaseDataset
from ..utils.download import create_staging_dir
from ..handlers.raster_handlers import RasterHandler
from ..handlers.vector_handlers import VectorHandler

# TODO: hanlde confiugration
# Configuration.create(hdx_site="prod", user_agent="worldex", hdx_read_only=True)

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
            properties={
                "url": f"https://data.humdata.org/dataset/{id}",
                "original_source": dataset["dataset_source"],
            },
            keywords=[],
        )
        # TODO: figure out a better way of keeping this
        obj._dataset = dataset
        return obj

    def index(self, dir=None):
        with create_staging_dir(dir) as (staging_dir, is_tempdir):
            # TODO: repopulate _dataset if missing
            resources = self._dataset.resources
            resource = next(
                filter(
                    lambda x: x["format"] in PRIORITY,
                    sorted(resources, key=lambda x: PRIORITY.index(x["format"])),
                )
            )
            if resource is None:
                raise Exception("Could not find a valid type")

            filename = resource["name"]

            # Skip downloading if file exists in dir
            file_path = staging_dir / filename
            if not os.path.exists(file_path):
                _, temp_filename = resource.download(staging_dir)
                if temp_filename != file_path:
                    # hdx has a weird filenaming when downloading files as it append file extensions.
                    # it becomes file.shp.zip.shp this addresses by handling the renaming
                    os.rename(temp_filename, staging_dir / filename)

            # TODO: Figure out how to handle zipped files
            if "GeoTIFF" == resource["format"]:
                handler = RasterHandler.from_file(file_path)
            else:
                handler = VectorHandler.from_file(file_path)
            h3indices = handler.h3index()
            self.bbox = wkt.dumps(box(*handler.bbox))
            df = pd.DataFrame({"h3_index": h3indices})

        if not is_tempdir:
            df.to_parquet(staging_dir / "h3.parquet", index=False)
            with open(staging_dir / "metadata.json", "w") as f:
                f.write(self.model_dump_json())
        return df
