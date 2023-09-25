from setuptools import setup, find_packages

setup(
    name="worldex",
    version="0.0.1",
    description="Handle geospatial data types and convert them into H3 indices",
    packages=find_packages(),
    install_requires=[
        "rasterio>=1.3.8,<2",
        "h3ronpy>=0.17.4,<1",
        "geopandas>=0.3.2,<1",
    ],
)
