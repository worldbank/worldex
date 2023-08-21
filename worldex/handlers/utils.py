import pathlib

import pandas as pd

from ..types import File
from .vector_handlers import VectorHandler, POSSIBLE_X, POSSIBLE_Y

EXTENSION_HANDLER_MAPPING = {".gpx": VectorHandler}


def csv_type_checker(file: File) -> str:
    """Determines CSV type based on column names"""
    df = pd.read_csv(file, nrows=0)  # just read column names
    if any(x in df.columns for x in POSSIBLE_X) and any(
        y in df.columns for y in POSSIBLE_Y
    ):
        return "gps"
    else:
        return ""


def index_file(file: File) -> str:
    """Indexes file based on filetype"""
    if isinstance(file, str):
        file = pathlib.Path(file)
    extension = file.suffix
    if extension == ".csv":
        csv_type = csv_type_checker(file)
        if csv_type == "gps":
            handler = VectorHandler.from_csv(file)
    else:
        handler = EXTENSION_HANDLER_MAPPING.get(extension)(file)
    return handler.h3index()
