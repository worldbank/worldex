import json
from langchain.docstore.document import Document
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings

import os
import sys


# # TODO: Remove the dotenv loading later...
from dotenv import load_dotenv
load_dotenv(".envrc")

from app.search.embedding import get_collection_name, get_embedding_model
from app.models import Dataset
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker

# # TODO: Change this later to the actual DB...
DATABASE_CONNECTION = "postgresql://postgres:pass@localhost:5432/public.datasets"
# DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")

# Connect to the Qdrant server
batch_size = 512

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_PORT = int(os.getenv("QDRANT_PORT"))
QDRANT_GRPC_PORT = int(os.getenv("QDRANT_GRPC_PORT"))
QDRANT_COLLECTION_PREFIX = os.getenv("QDRANT_COLLECTION_PREFIX")


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

        Qdrant.from_documents(documents,
            get_embedding_model(),
            url=QDRANT_URL,
            port=QDRANT_PORT,
            grpc_port=QDRANT_GRPC_PORT,
            prefer_grpc=True,
            collection_name=get_collection_name(),
            force_recreate=True,
            batch_size=batch_size,
        )

if __name__ == "__main__":
    # cd api/
    # poetry run python -m scripts.qdrant_index_datasets

    sys.exit(main())