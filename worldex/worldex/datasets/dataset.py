"""Provider for basic datasets
"""

from datetime import date, datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

import pandas as pd
from h3ronpy.arrow import cells_parse, cells_to_string, compact
from pydantic import UUID4, BaseModel, Field
from pydantic.networks import AnyUrl
from shapely import wkt
from shapely.geometry import box
from typing_extensions import Literal

from ..handlers.raster_handlers import RasterHandler
from ..handlers.vector_handlers import VectorHandler
from ..utils.deep_merge import deep_merge


class BaseDataset(BaseModel):
    """Base datasets

    TODO: add validation
    TODO: h3 file
    """

    id: UUID4 = Field(default_factory=uuid4)
    name: str
    source_org: str
    last_fetched: datetime
    files: list[str]
    description: str
    data_format: Optional[str] = None
    projection: Optional[str] = None
    properties: Optional[dict] = None
    bbox: Optional[str] = None
    keywords: list[str]
    date_start: Optional[date] = None
    date_end: Optional[date] = None
    accessibility: Optional[Literal["public/open", "public/login", "private"]] = None
    url: Optional[AnyUrl] = None
    _home_url: Optional[AnyUrl] = None

    def set_dir(self, dir):
        self._dir = Path(dir)
        self._dir.mkdir(exist_ok=True)
        return self

    def write(self, df):
        compacted_df = pd.DataFrame(
            {"h3_index": cells_to_string(compact(cells_parse(df.h3_index)))}
        )
        df.to_parquet(self.dir / "h3.parquet", index=False)
        compacted_df.to_parquet(self.dir / "h3-compact.parquet", index=False)
        with open(self.dir / "metadata.json", "w") as f:
            f.write(self.model_dump_json())

    def get_base_metadata_schema(self):
        home_url = self._home_url
        bbox = wkt.loads(self.bbox)
        metadata_information = dict(
            title=self.name, producers=[], production_date=self.last_fetched
        )
        description = dict(
            idno=self.id,
            language="eng",
            characterSet=["utf8"],
            hierarchyLevel="dataset",
            contact=[
                dict(
                    organizationName=self.source_org,
                    contactInfo=dict(
                        onlineResource=dict(linkage=home_url, name="Website")
                    ),
                    role="pointOfContact",
                ),
            ],
            metadataStandardName="ISO 19115:2003/19139",
            # TODO: Fix this
            referenceSystemInfo=[
                dict(code=self.projection, codeSpace="EPSG"),
                dict(code="WGS 84", codeSpace="World Geodetic System (WGS)"),
            ],
            identificationInfo=dict(
                abstract=self.description,
                credit=self.source_org,
                status="completed",
                pointOfContact=[],
                resourceMaintenance=[dict(maintenanceOrUpdateFrequency="notPlanned")],
                # TODO: FIX
                descriptiveKeywords=[],
                resourceConstraints=[
                    dict(
                        legalConstraints=dict(
                            accessConstraints=["unrestricted"],
                            useConstraints=["licenceUnrestricted"],
                        )
                    )
                ],
                extent=dict(
                    geographicElement=[
                        dict(
                            geographicBoundingBox=dict(
                                southBoundLatitude=bbox.bounds[0],
                                westBoundLongitude=bbox.bounds[1],
                                northBoundLatitude=bbox.bounds[2],
                                eastBoundLongitude=bbox.bounds[3],
                            )
                        ),
                    ],
                ),
                language=["eng"],
                characterSet=list(dict(codeListValue="utf8")),
                distributionInfo=dict(
                    distributor=[
                        dict(
                            organizationName=self.source_org,
                            contactInfo=dict(
                                onlineResource=dict(linkage=home_url, name="Website")
                            ),
                            role="pointOfContact",
                        )
                    ],
                ),
                metadataMaintenance=dict(maintenanceAndUpdateFrequency="notPlanned"),
            ),
        )
        return {
            "metadata_information": metadata_information,
            "description": description,
        }

    def get_specific_metadata_schema(self):
        return {}

    def to_metadata_schema(self, others=None):
        base_schema = self.get_base_metadata_schema()
        default = self.get_specific_metadata_schema() or {}
        others = others if others else {}
        return deep_merge(base_schema, default, others)

    @property
    def dir(self):
        return self._dir

    def index_from_gdf(self, gdf):
        handler = VectorHandler(gdf)
        h3indices = handler.h3index()
        self.bbox = wkt.dumps(box(*handler.bbox))
        df = pd.DataFrame({"h3_index": h3indices})
        self.write(df)
        return df

    def index_from_riosrc(self, src, window=None):
        handler = RasterHandler(src)
        h3indices = handler.h3index(window=None)
        self.bbox = wkt.dumps(box(*handler.bbox))
        df = pd.DataFrame({"h3_index": h3indices})
        self.write(df)
        return df
