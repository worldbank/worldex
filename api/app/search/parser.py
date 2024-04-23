import pycountry
from gliner import GLiNER
import os


_MODEL = None
CACHE_DIR = os.environ.get("CACHE_DIR", None)
GLINER_MODEL = os.environ.get("GLINER_MODEL", "urchade/gliner_base")

print(f"Cache directory: {CACHE_DIR}")


def get_model():
    """Get the GLiNER model.

    Returns:
        GLiNER: The GLiNER model

    """

    global _MODEL
    if _MODEL is None:
        _MODEL = GLiNER.from_pretrained(GLINER_MODEL, cache_dir=CACHE_DIR)

    return _MODEL


def get_country(country_name: str):
    """Get the normalized country information from the country name.

    This function uses the pycountry library to search for the country name.

    Args:
        country_name (str): The country name

    Returns:
        pycountry.db.Country: The normalized country information

    """

    try:
        return pycountry.countries.search_fuzzy(country_name)
    except LookupError:
        return None


def parse_query(query: str, labels: list, threshold: float = 0.8):
    """Parse the query and extract entities.

    Args:
        query (str): The query
        labels (list): The list of labels to extract
        threshold (float, optional): The threshold for extraction. Defaults to 0.8.

    Returns:
        dict: The parsed query and extracted entities

    """

    model = get_model()

    _entities = model.predict_entities(query, labels, threshold=threshold)

    entities = []

    for entity in _entities:
        if entity["label"] == "country":
            country = get_country(entity["text"])
            if country:
                entity["normalized"] = [dict(c) for c in country]
                entities.append(entity)
        else:
            entities.append(entity)

    return {"query": query, "entities": entities}
