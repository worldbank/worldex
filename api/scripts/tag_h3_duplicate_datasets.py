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
            q = text(
                """
                WITH country_datasets AS (
                    SELECT id, name FROM datasets
                    WHERE name ~* :natl_boundary_country
                ),
                with_h3_counts AS (
                    SELECT
                        country_datasets.id,
                        country_datasets.name,
                        COUNT(h3_data.id) h3_count
                    FROM h3_data
                    JOIN
                    country_datasets ON country_datasets.id = h3_data.dataset_id
                    GROUP BY country_datasets.id, country_datasets.name
                    ORDER BY h3_count
                )
                SELECT * FROM with_h3_counts
                WHERE h3_count = (SELECT h3_count FROM with_h3_counts WHERE name ILIKE '%national boundaries%')
                ORDER BY CASE WHEN name ILIKE '%national boundaries%' THEN 0 ELSE 1 end;
                """
            ).bindparams(natl_boundary_country=natl_boundary_country)
            results = sess.execute(q).fetchall()
            country_datasets = [row._mapping for row in results]
            print(country_datasets)

            assert "national boundaries" in country_datasets[0]["name"].lower()
            natl_boundary_dataset_id = country_datasets[0]["id"]
            duplicate_dataset_ids = [d["id"] for d in country_datasets[1:]]
            mark_as_duplicate_q = text(
                """
                UPDATE datasets
                SET dataset_id = :natl_boundary_dataset_id
                WHERE id = ANY(:duplicate_dataset_ids)
                """
            ).bindparams(natl_boundary_dataset_id=natl_boundary_dataset_id, duplicate_dataset_ids=duplicate_dataset_ids)
            sess.execute(mark_as_duplicate_q)

            sess.execute(
                text("""
                    UPDATE datasets
                    SET has_derivatives = TRUE
                    WHERE id = (
                        SELECT id FROM datasets WHERE name ILIKE :natl_boundary_country
                    )
                """).bindparams(natl_boundary_country=f"%national boundaries%{country}%")
            )
            sess.commit()


if __name__ == "__main__":
    sys.exit(main())
