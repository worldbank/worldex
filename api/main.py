import uvicorn
from fastapi import Depends, FastAPI
from databases import Database

app = FastAPI()
database = Database("postgresql+asyncpg://worldex:postgres@db/worldex")


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/h3_tiles/")
async def get_h3_tiles(z: int, x: int, y: int):
    results = await database.fetch_all(f"SELECT h3_polygon_to_cells(ST_Transform(ST_TileEnvelope({z}, {x}, {y}), 4326), 5)")
    return {result[0] for result in results}

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host='0.0.0.0')