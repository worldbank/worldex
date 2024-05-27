from gradio_client import Client


# Initialize the client
client = Client("avsolatorio/query-parser")


def parse_query(query: str, labels: list, threshold: float = 0.3, nested_ner: bool = False):
    """Parse the query and extract entities. This function is a wrapper for the Gradio API
    running on the Hugging Face Space: https://huggingface.co/spaces/avsolatorio/query-parser.

    Args:
        query (str): The query
        labels (list): The list of labels to extract
        threshold (float, optional): The threshold for extraction. Defaults to 0.3.

    Returns:
        dict: The parsed query and extracted entities

    """

    labels = ",".join(labels)

    return client.predict(
            query=query,
            labels=labels,
            threshold=threshold,
            nested_ner=nested_ner,
            api_name="/parse_query"
    )
