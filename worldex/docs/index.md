# WorldEx

This is the documentation for the `worldex` package. The package is used to catalog geospatial data using H3 indices. The [WorldEx](https://worldex.org/) application comprises a collection of datasets sourced from different data provides that are indexed using H3 indices to demonstrate the value of the standardized geospatial indexing.

## Introduction

`worldex` is a python package for cataloging geospatial data using H3 indices. It provides a suite of tools that standardizes cataloging geospatial data and streamlines common processes needed for indexing data.

It offers a simple API for indexing common geospatial data formats such as GeoJSON, shapefiles, and rasters. It also provides a component for fetching data from the web and indexing it.

## H3 indices

H3 is a geospatial indexing system that partitions the world into hexagonal cells with varying resolutions. It can index both vector and raster data into indexes that allows for quick aggregation for visualizations.

To learn more about H3 indices, go to the official documentation: https://h3geo.org/docs/

## Catalog Fields

A list of fields worldex considers

1. `id` - A unique id for dataset within the worldex system. By default generated a uuid4 for this. This helps keep track of future updates.
2. `name` - The name of the dataset.
3. `source_org` - The organization where this dataset was stored.
4. `last_fetched` - The date where the dataset was last fetched for indexing.
5. `files` - A list of urls or file paths of the files.
6. `description` - A description of the datasets
7. `data_format` - The data format of the data
8. `projection` - The projection of the data
9. `properties` - A dictionary containing additional information regarding the dataset that is not part of the fields
10. `bbox` - WKT representation of the bounds of the dataset
11. `keywords` - A list of strings for the dataset
12. `date_start` - The start of date range of the dataset covers
13. `date_end` - The start of date range of the dataset covers
14. `accessibility` - The accessibility of the data
15. `url` - A url for the website
