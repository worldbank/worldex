# WorldEx

This is the documentation for the `worldex` package. The package is used to catalog geospatial data using H3 indices. The [WorldEx](https://worldex.org/) application comprises a collection of datasets sourced from different data provides that are indexed using H3 indices to demonstrate the value of the standardized geospatial indexing.

## Introduction

`worldex` is a python package for cataloging geospatial data using H3 indices. It provides a suite of tools that standardizes cataloging geospatial data and streamlines common processes needed for indexing data.

It offers a simple API for indexing common geospatial data formats such as GeoJSON, shapefiles, and rasters. It also provides a component for fetching data from the web and indexing it.

## H3 indices

H3 is a geospatial indexing system that partitions the world into hexagonal cells with varying resolutions. It can index both vector and raster data into indexes that allows for quick aggregation for visualizations.

To learn more about H3 indices, go to the official documentation: https://h3geo.org/docs/

## Catalog Fields

| Field           | Description                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | A unique identifier for the dataset within the worldex system. By default, a UUID4 is generated. This helps keep track of future updates. |
| `name`          | The name of the dataset.                                                                                                                  |
| `source_org`    | The organization where this dataset is stored.                                                                                            |
| `last_fetched`  | The date when the dataset was last fetched for indexing.                                                                                  |
| `files`         | A list of URLs or file paths of the files.                                                                                                |
| `description`   | A description of the dataset.                                                                                                             |
| `data_format`   | The data format of the dataset.                                                                                                           |
| `projection`    | The projection of the data.                                                                                                               |
| `properties`    | A dictionary containing additional information regarding the dataset that is not part of the predefined fields.                           |
| `bbox`          | WKT representation of the bounds of the dataset.                                                                                          |
| `keywords`      | A list of strings representing keywords for the dataset.                                                                                  |
| `date_start`    | The start date of the dataset's coverage.                                                                                                 |
| `date_end`      | The end date of the dataset's coverage.                                                                                                   |
| `accessibility` | The accessibility status of the data.                                                                                                     |
| `url`           | A URL for the dataset's website.                                                                                                          |
