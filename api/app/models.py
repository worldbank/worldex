from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel
from typing import List, Optional

class HealthCheck(BaseModel):
    name: str
    version: str


class Dataset(SQLModel, table=True):
    """
    Dataset metadata, including name
    """
    __tablename__ = "datasets"

    id: Optional[int] = Field(default=None, primary_key=True, index=True) 
    name: str = Field(nullable=False)

    h3_data: List["H3Data"] = Relationship(back_populates="dataset")


class H3Data(SQLModel, table=True):
    """
    Represents and dataset entries the are under an h3 tile
    """
    __tablename__ =  "h3_data"

    id: Optional[int] = Field(default=None, primary_key=True, index=True)

    dataset_id: int = Field(default=None, foreign_key="datasets.id")
    dataset: Dataset = Relationship(back_populates="h3_data")