import requests


def download_file(url, filename):
    """Download a large file using python streams"""
    # TODO: Optional progress bar
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        # total_size_in_bytes= int(response.headers.get('content-length', 0))
        # progress_bar = tqdm(total=total_size_in_bytes, unit='iB', unit_scale=True)
        with open(filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                # progress_bar.update(len(data))
                f.write(chunk)
