import os
import sys
import traceback

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DRY_RUN = os.getenv("DRY_RUN", "true").lower() == "true"
DATABASE_CONNECTION = os.getenv("DATABASE_URL_SYNC")
COUNTRY_KEYWORDS = [
    "canada",
    "russia",
    "united states",
    "china",
    # "india",
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
            try:
                natl_boundary_country = (
                    "national boundaries.*{country}"
                    if country != "united states"
                    else "national boundaries.*{country}(?! minor outlying islands)"
                )
                natl_boundary_country = f"national boundaries.*{country}$"
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
                            SELECT id FROM datasets WHERE name ~* :natl_boundary_country
                        ),
                        duplicates AS (
                            SELECT id AS dupe_id FROM datasets WHERE dataset_id = (SELECT id FROM natl_boundary)
                        )
                        DELETE FROM h3_children_indicators WHERE dataset_id IN (SELECT dupe_id FROM duplicates);
                        """
                    ).bindparams(natl_boundary_country=natl_boundary_country)
                )
                if DRY_RUN:
                    print("Dry run only, not committing")
                    continue
                sess.commit()
            except Exception:
                traceback.print_exc()
                continue


if __name__ == "__main__":
    sys.exit(main())
