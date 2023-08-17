from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.types import UserDefinedType
from app.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship


class H3Index(UserDefinedType):
    def get_col_spec(self):
        return "H3INDEX"

    # def bind_expression(self, bindvalue):
    #     pass

    # def column_expression(self, col):
    #     pass


class HealthCheck(BaseModel):
    name: str
    version: str


class Dataset(Base):
    """
    Dataset metadata, including name
    """

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    h3_data = relationship("H3Data", backref="dataset", cascade="all, delete-orphan")


class H3Data(Base):
    """
    Represents and dataset entries the are under an h3 tile
    """

    __tablename__ = "h3_data"

    id = Column(Integer, primary_key=True)
    h3_index = Column(H3Index, index=True, nullable=False)

    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))

    __table_args__ = (UniqueConstraint("dataset_id", "h3_index"),)
