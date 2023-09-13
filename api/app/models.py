from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.types import UserDefinedType
from app.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column


class H3Index(UserDefinedType):
    def get_col_spec(self):
        return "H3INDEX"


class HealthCheck(BaseModel):
    name: str
    version: str


class H3TileRequest(BaseModel):
    resolution: int
    should_count: Optional[bool]


dataset_keyword_association_table = Table(
    "dataset_keyword_association_table",
    Base.metadata,
    Column("dataset_id", ForeignKey("datasets.id"), primary_key=True),
    Column("keyword_id", ForeignKey("keywords.id"), primary_key=True),
)


class Dataset(Base):
    """
    Dataset metadata, including name
    """

    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=False)

    keywords: Mapped[List["Keyword"]] = relationship(
        secondary=dataset_keyword_association_table, back_populates="datasets"
    )
    h3_data: Mapped[List["H3Data"]] = relationship(
        backref="dataset", cascade="all, delete-orphan"
    )


class Keyword(Base):

    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(primary_key=True)
    keyword = Column(String, nullable=False)

    datasets: Mapped[List["Dataset"]] = relationship(
        secondary=dataset_keyword_association_table, back_populates="keywords"
    )


class H3Data(Base):
    """
    Represents and dataset entries the are under an h3 tile
    """

    __tablename__ = "h3_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    h3_index = Column(H3Index, index=True, nullable=False)

    dataset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (UniqueConstraint("dataset_id", "h3_index"),)
