"""
Automates indexing of world pop datasets
"""
from .dataset import BaseDataset


class HDXDataset(BaseDataset):
    source_org: str = "HDX"

    @classmethod
    def from_url(cls, url: str):
        pass

    def index(self, dir=None):
        pass
