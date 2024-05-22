import os
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
COUNTRY_KEYWORDS = [
    "canada",
    "russia",
    "united states",
    "china",
    "india",
    "brazil",
    "australia",
    "indonesia",
    "greenland",
    "sweden",
    "argentina",
    "norway",
    "chile",
    "finland",
    "kazakhstan",
]

def main():
    engine = create_engine(DATABASE_CONNECTION)

    Session = sessionmaker(bind=engine)
    with Session() as sess:
        for country in COUNTRY_KEYWORDS:
            natl_boundary_country = (
                "national boundaries.*{country}"
                if country != "united states"
                else "national boundaries.*{country}(?! minor outlying islands)"
            )
            sess.execute(
                text(
                    """
                    WITH natl_boundary AS (
                        SELECT id FROM datasets WHERE name ~* :natl_boundary_country
                    ),
                    duplicates AS (
                        SELECT id AS dupe_id FROM datasets WHERE dataset_id = (SELECT id FROM natl_boundary)
                    )
                    DELETE FROM h3_data WHERE dataset_id IN (SELECT dupe_id FROM duplicates);
                    """
                ).bindparams(natl_boundary_country=natl_boundary_country)
            )

            sess.execute(
                text(
                    """
                    WITH natl_boundary AS (
                        SELECT id FROM datasets WHERE name ILIKE :natl_boundary_country
                    ),
                    duplicates AS (
                        SELECT id AS dupe_id FROM datasets WHERE dataset_id = (SELECT id FROM natl_boundary)
                    )
                    DELETE FROM h3_children_indicators WHERE dataset_id IN (SELECT dupe_id FROM duplicates);
                    """
                ).bindparams(natl_boundary_country=f"%national boundaries%{country}%")
            )
            sess.commit()


if __name__ == "__main__":
    sys.exit(main())
