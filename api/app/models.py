from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from sqlmodel import Field, SQLModel

class HealthCheck(BaseModel):
    name: str
    version: str


class Dataset(SQLModel, table=True):
    """
    Dataset metadata, including name
    """
    __tablename__ = "datasets"

    id: int = Field(primary_key=True, index=True) 
    name: str = Field(nullable=False)

    # h3_data = relationship("H3Data", back_populates="dataset")


# class H3Data(SQLModel):
#     """
#     Represents and dataset entries the are under an h3 tile
#     """
#     __tablename__ =  "h3_data"

#     id = Column(Integer, primary_key=True, index=True)
#     dataset = relationship("Dataset", back_populates="h3_data")