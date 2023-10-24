from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.types import UserDefinedType
from app.db import Base
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    ForeignKey,
    UniqueConstraint,
    Table,
    Index,
    text,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from geoalchemy2.types import Geometry


class H3Index(UserDefinedType):
    def get_col_spec(self):
        return "H3INDEX"


class HealthCheck(BaseModel):
    name: str
    version: str


class H3TileRequest(BaseModel):
    resolution: int


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
    source_org: Mapped[str] = mapped_column(nullable=True)
    last_fetched: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    files: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=True, default=[])
    description: Mapped[str] = mapped_column(nullable=True)
    data_format: Mapped[str] = mapped_column(nullable=False)
    projection: Mapped[str] = mapped_column(default="epsg:4326", nullable=False)
    properties = Column(JSONB, nullable=True)
    bbox = Column(Geometry(), nullable=False)
    keywords: Mapped[List["Keyword"]] = relationship(
        secondary=dataset_keyword_association_table, back_populates="datasets"
    )
    h3_data: Mapped[List["H3Data"]] = relationship(
        backref="dataset", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "ix_datasets_bbox_srid",
            text("st_setsrid(bbox, 4326)"),
            postgresql_using="gist",
        ),
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

    __table_args__ = (
        UniqueConstraint("dataset_id", "h3_index"),
        Index(
            "ix_h3_data_h3_index_as_point",
            text("h3_cell_to_geometry(h3_index)"),
            postgresql_using="gist",
        ),
        Index("ix_h3_data_h3_index_res", text("h3_get_resolution(h3_index)")),
        Index(
            "ix_h3_data_h3_index_parent_res1",
            text("h3_cell_to_parent(h3_index, 1)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 1"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res2",
            text("h3_cell_to_parent(h3_index, 2)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 2"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res3",
            text("h3_cell_to_parent(h3_index, 3)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 3"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res4",
            text("h3_cell_to_parent(h3_index, 4)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 4"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res5",
            text("h3_cell_to_parent(h3_index, 5)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 5"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res6",
            text("h3_cell_to_parent(h3_index, 6)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 6"),
        ),
        Index(
            "ix_h3_data_h3_index_parent_res7",
            text("h3_cell_to_parent(h3_index, 7)"),
            postgresql_where=text("h3_get_resolution(h3_index) > 7"),
        ),
        Index(
            "ix_h3_data_res1_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 1)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 1"),
        ),
        Index(
            "ix_h3_data_res2_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 2)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 2"),
        ),
        Index(
            "ix_h3_data_res3_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 3)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 3"),
        ),
        Index(
            "ix_h3_data_res4_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 4)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 4"),
        ),
        Index(
            "ix_h3_data_res5_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 5)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 5"),
        ),
        Index(
            "ix_h3_data_res6_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 6)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 6"),
        ),
        Index(
            "ix_h3_data_res7_parent_dataset_id",
            text("h3_cell_to_parent(h3_index, 7)"),
            dataset_id,
            postgresql_where=text("h3_get_resolution(h3_index) > 7"),
        ),
    )
