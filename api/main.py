import uvicorn
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from database import SessionLocal, engine

app = FastAPI()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally: 
        db.close()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/h3_tiles/")
def get_h3_tiles(db: Session = Depends(get_db)):
    with engine.connect() as con:
        return con.execute(text(
            "SELECT i, h3_get_num_cells(i) FROM generate_series(0, 15, 3) i;"
        ))


if __name__ == "__main__":
    uvicorn.run(app, port=8000, host='0.0.0.0')