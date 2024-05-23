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
                dupe_ids = sess.scalars(
                    text(
                        """
                        SELECT id FROM datasets
                        WHERE dataset_id IS NOT NULL
                        AND dataset_id = (
                            SELECT id FROM datasets WHERE name ~* :natl_boundary_country
                        )
                        """
                    ).bindparams(natl_boundary_country=natl_boundary_country)
                ).all()
                print("Deleting h3 tiles of the ff dupe datasets:", dupe_ids)
                for dupe_id in dupe_ids:
                    sess.execute(text("DELETE FROM h3_data WHERE dataset_id = :dupe_id").bindparams(dupe_id=dupe_id))
                    sess.execute(text("DELETE FROM h3_children_indicators WHERE dataset_id = :dupe_id").bindparams(dupe_id=dupe_id))
                if DRY_RUN:
                    print("Dry run only, not committing")
                    continue
                sess.commit()
            except Exception:
                traceback.print_exc()
                continue


if __name__ == "__main__":
    sys.exit(main())
