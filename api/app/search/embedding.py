import os
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings

QDRANT_COLLECTION_PREFIX = os.getenv("QDRANT_COLLECTION_PREFIX")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE")

# client = qdrant_client.QdrantClient(url=url, port=port, grpc_port=grpc_port)
# doc_store = Qdrant(client=client, collection_name=subcollection_name, embeddings=embeddings)


def get_collection_name():
    return f"{QDRANT_COLLECTION_PREFIX}__{EMBEDDING_MODEL.replace('/', '__')}"


def get_embedding_model():
    return SentenceTransformerEmbeddings(
        model_name=EMBEDDING_MODEL,
        show_progress=True,
        model_kwargs={"device": EMBEDDING_DEVICE},
    )
