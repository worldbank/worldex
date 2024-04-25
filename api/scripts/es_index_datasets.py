import os
import sys

from app.document import Dataset as DatasetDocument
from app.models import Dataset
from elasticsearch_dsl import connections
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
ELASTICSEARCH_CONNECTION = os.getenv("ELASTICSEARCH_URL_SYNC")
# Define connection to your Elasticsearch cluster
# connections.create_connection(hosts=['http://localhost:9200'])
connections.create_connection(hosts=[ELASTICSEARCH_CONNECTION], verify_certs=False)


def main():
    engine = create_engine(DATABASE_CONNECTION)
    Session = sessionmaker(bind=engine)
    DatasetDocument._index.delete()
    with Session() as sess:
        result = sess.execute(select(Dataset))
        for idx, r in enumerate(result):
            dataset = r[0]
            doc = DatasetDocument(
                pg_id = dataset.id,
                uid = dataset.uid,
                name = dataset.name,
                source_org = dataset.source_org,
                last_fetched = dataset.last_fetched,
                date_start = dataset.date_start,
                date_end = dataset.date_end,
                url = dataset.url,
                files = dataset.files,
                accessibility = dataset.accessibility,
                description = dataset.description,
                projection = dataset.projection,
                properties = dataset.properties,
                # bbox = dataset.bbox
            )
            doc.save()
            if (idx > 0 and idx % 100 == 0):
                print(f"{idx} documents indexed")
            # print(doc)


if __name__ == "__main__":
    sys.exit(main())