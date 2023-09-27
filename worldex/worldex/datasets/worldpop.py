"""
Automates indexing of world pop datasets
"""
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import pandas as pd
import requests
from bs4 import BeautifulSoup
from shapely import wkt
from shapely.geometry import box

from ..handlers.raster_handlers import RasterHandler
from .dataset import BaseDataset

WORLDPOP_API_CACHE = {}


def worldpop_get(url):
    """Simple caching for world pop api. Only cache certain urls"""
    if not url in WORLDPOP_API_CACHE:
        WORLDPOP_API_CACHE[url] = requests.get(url)
    return WORLDPOP_API_CACHE[url]


class WorldPopDataset(BaseDataset):
    source_org: str = "WorldPop"

    @classmethod
    def from_url(cls, url: str):
        # TODO: catch malformed url
        if "summary" in url:
            url = cls.summary_parser(url)
        data = requests.get(url).json()["data"]
        if isinstance(data, list):
            raise Exception("Processing a list of data is not yet supported")

        return cls(
            name=data["title"],
            last_fetched=datetime.now().isoformat(),
            files=data["files"],
            data_format="GeoTiff",  # TODO figure this out from metadata
            description=data["desc"],
            projection="EPSG:4326",
            properties={
                "url_summary": data["url_summary"],
                "category": data["category"],
            },
            keywords=[],
        )

    @classmethod
    def summary_parser(cls, url: str):
        # TODO: catch malformed url
        parsed_url = urlparse(url)
        data_id = parse_qs(parsed_url.query)["id"][0]

        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        category = soup.find(class_="breadcrumb").find_all("a")[0].text
        listing = soup.find(class_="breadcrumb").find_all("a")[1].text
        # TODO: Add useful error message
        categories = worldpop_get("https://hub.worldpop.org/rest/data/").json()
        category_alias = next(
            filter(lambda x: x["name"] == category, categories["data"])
        )["alias"]
        listings = worldpop_get(
            f"https://hub.worldpop.org/rest/data/{category_alias}/"
        ).json()
        listing_alias = next(filter(lambda x: x["name"] == listing, listings["data"]))[
            "alias"
        ]
        return f"https://hub.worldpop.org/rest/data/{category_alias}/{listing_alias}/?id={data_id}"

    def index(self, dir):
        # TODO: Allow dir to be none. Use temp dir
        if isinstance(dir, str):
            dir = Path(dir)

        # TODO: Allow none tiff files lie zip, 7z files.
        url = next(filter(lambda x: x.endswith(".tif"), self.files))
        filename = Path(url).name

        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(dir / filename, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        handler = RasterHandler.from_file(dir / filename)
        h3indices = handler.h3index()

        self.bbox = wkt.dumps(box(*handler.src.bounds))
        df = pd.DataFrame({"h3_index": h3indices})

        df.to_parquet(dir / "h3.parquet", index=False)

        with open(dir / "metadata.json", "w") as f:
            f.write(self.model_dump_json())

        return df
