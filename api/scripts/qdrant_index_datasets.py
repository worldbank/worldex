import json
from langchain.docstore.document import Document
from langchain_community.vectorstores import Qdrant

import os
import sys

from app.search.embedding import get_embedding_model, get_qdrant_kwargs
from app.models import Dataset
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# # TODO: Change this later to the actual DB...
# DATABASE_CONNECTION = "postgresql://postgres:pass@localhost:5432/public.datasets"
DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")

# Connect to the Qdrant server
batch_size = 512


def main():
    engine = create_engine(DATABASE_CONNECTION)
    Session = sessionmaker(bind=engine)
    documents = []

    with Session() as sess:
        result = sess.execute(select(Dataset))
        for idx, r in enumerate(result):
            dataset = r[0]
            doc = dataset.__dict__.copy()

            # Remove SQLAlchemy metadata
            doc.pop("_sa_instance_state", None)

            # Remove bbox field
            doc.pop("bbox", None)

            # Convert the document to a dictionary
            doc = json.loads(json.dumps(doc, default=str))

            # Create a page content from the name and description
            page_content = f"{doc['name']}\n\n{doc['description']}"

            documents.append(Document(page_content=page_content, metadata=doc))

            if (idx > 0 and idx % 100 == 0):
                print(f"{idx} documents processed")

        qdrant_kwargs = get_qdrant_kwargs()
        Qdrant.from_documents(documents,
            get_embedding_model(),
            force_recreate=True,
            batch_size=batch_size,
            **qdrant_kwargs
        )

if __name__ == "__main__":
    # cd api/
    # poetry run python -m scripts.qdrant_index_datasets

    sys.exit(main())
