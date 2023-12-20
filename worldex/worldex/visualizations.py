import requests
import geopandas as gpd
import pandas as pd
from pathlib import Path
from h3ronpy.arrow import cells_parse
from h3ronpy.pandas.vector import cells_dataframe_to_geodataframe
import contextily as cx
import json
import pandas as pd


def viz(file):
    """Visualise a h3 file"""
    h3 = pd.read_parquet(file)

    h3_gdf = cells_dataframe_to_geodataframe(
        pd.DataFrame({"cell": cells_parse(h3.h3_index)})
    )
    h3_gdf_reprojected = h3_gdf.to_crs(epsg=3857)
    ax = h3_gdf_reprojected.plot(figsize=(10, 10), alpha=0.5, edgecolor="k")
    return cx.add_basemap(ax, source=cx.providers.CartoDB.Positron)
