import os
from urllib.parse import urlparse
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
import qdrant_client
from langchain_community.vectorstores import Qdrant

QDRANT_COLLECTION_PREFIX = os.getenv("QDRANT_COLLECTION_PREFIX")
EMBEDDING_QUERY_PREFIX = os.getenv("EMBEDDING_QUERY_PREFIX", "")
EMBEDDING_SEARCH_TYPE = os.getenv("EMBEDDING_SEARCH_TYPE", "similarity")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")

q_parsed = urlparse(os.getenv("QDRANT_URL"))
qdrant_url = f"{q_parsed.scheme}://{q_parsed.hostname}"
qdrant_port = q_parsed.port or int(os.getenv("QDRANT_PORT", 6333))
qdrant_grpc_port = int(os.getenv("QDRANT_GRPC_PORT", 6334))


def get_collection_name():
    return f"{QDRANT_COLLECTION_PREFIX}__{EMBEDDING_MODEL.replace('/', '__')}"


def get_embedding_model():
    return SentenceTransformerEmbeddings(
        model_name=EMBEDDING_MODEL,
        show_progress=True,
        model_kwargs={"device": EMBEDDING_DEVICE},
    )


def get_qdrant_kwargs():
    return dict(
        url=qdrant_url,
        port=qdrant_port,
        grpc_port=qdrant_grpc_port,
        prefer_grpc=True,
        collection_name=get_collection_name(),
    )


# TODO: Improve management of this later
client = qdrant_client.QdrantClient(url=qdrant_url, port=qdrant_port, grpc_port=qdrant_grpc_port)
doc_store = Qdrant(client=client, collection_name=get_collection_name(), embeddings=get_embedding_model())


def search_embedding(query):
    query = f"{EMBEDDING_QUERY_PREFIX}{query}"
    results = doc_store.similarity_search(query, search_type=EMBEDDING_SEARCH_TYPE)

    return results
