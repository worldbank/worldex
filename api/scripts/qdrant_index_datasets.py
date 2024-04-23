import json
from langchain.docstore.document import Document
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings

import os
import sys

from dotenv import load_dotenv
load_dotenv(".envrc")

from app.models import Dataset
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker


# Connect to the Qdrant server
url = "http://localhost"
port = 6323
grpc_port = 6324
collection_name = "worldex"
embedding_model = "mixedbread-ai/mxbai-embed-large-v1"
embedding_model = "avsolatorio/GIST-Embedding-v0"

embeddings = SentenceTransformerEmbeddings(model_name=embedding_model, show_progress=True, model_kwargs={"device": "mps"})

# client = qdrant_client.QdrantClient(url=url, port=port, grpc_port=grpc_port)
# doc_store = Qdrant(client=client, collection_name=collection_name, embeddings=embeddings)

# DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
DATABASE_CONNECTION = "postgresql://postgres:pass@localhost:5432/public.datasets"

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
            embeddings,
            url=url,
            port=port,
            grpc_port=grpc_port,
            prefer_grpc=True,
            collection_name=collection_name,
            force_recreate=True,
        )

if __name__ == "__main__":
    sys.exit(main())