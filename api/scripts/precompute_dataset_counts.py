import os
import sys

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func

from app.models import DatasetCountTile
from app.services import dataset_count_to_bytes, get_dataset_count_tiles
from sqlalchemy.dialects.postgresql import insert


DATABASE_CONNECION = os.getenv("DATABASE_URL_SYNC")

Z_H3_RESOLUTION_PAIRS = (
    (1, 2),
    (2, 3),
    (3, 4),
    (5, 5),
    (7, 6),
    (8, 7),
    (10, 8),
)


def get_stepped_z_resolution_pair(current_z: int) -> tuple[int, int]:
    for idx, (z, h3_res) in enumerate(Z_H3_RESOLUTION_PAIRS):
        if (z == current_z):
            return Z_H3_RESOLUTION_PAIRS[idx]
        elif (z > current_z):
            return Z_H3_RESOLUTION_PAIRS[idx - 1]
    return Z_H3_RESOLUTION_PAIRS[-1]


def main():
    engine = create_engine(DATABASE_CONNECION)
    Session = sessionmaker(bind=engine)
    start = datetime.now()
    with Session() as sess:
        for z in range(1, 8):
            _, resolution = get_stepped_z_resolution_pair(z)
            for x in range(0, 2**z):
                for y in range(0, 2**z):
                    print(f"{z}, {x}, {y}, res {resolution}")
                    results = get_dataset_count_tiles(sess, z, x, y, resolution, location=None)
                    dataset_counts = {'index': [], 'dataset_count': []}
                    for row in results:
                        dataset_counts['index'].append(row[0])
                        dataset_counts['dataset_count'].append(row[1])
                    dataset_count_bytes=dataset_count_to_bytes(dataset_counts)
                    insert_stmt = insert(DatasetCountTile).values(
                        z=z,
                        x=x,
                        y=y,
                        dataset_counts=dataset_count_bytes,
                    )
                    do_update_stmt = insert_stmt.on_conflict_do_update(
                        constraint="dataset_count_tiles_z_x_y_key",
                        set_=dict(dataset_counts=dataset_count_bytes, cached_at=func.now())
                    )
                    sess.execute(do_update_stmt)
                    sess.commit()
    duration = datetime.now() - start
    print(f"Finished in {duration.seconds} seconds")


if __name__ == "__main__":
    sys.exit(main())
