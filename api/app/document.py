from elasticsearch_dsl import Date, Document, GeoShape, Integer, Keyword, Object, Text


class Dataset(Document):
    pg_id = Integer()
    uid = Keyword()
    name = Keyword()
    source_org = Keyword()
    last_fetched = Date()
    date_start = Date()
    date_end = Date()
    url = Keyword()
    files = Keyword(multi=True)
    accessibility = Keyword()
    description = Text()
    projection = Keyword()
    properties = Object()
    bbox = GeoShape()
