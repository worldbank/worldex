import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from databases import Database
from services import get_h3_resolution

app = FastAPI()
database = Database("postgresql+asyncpg://worldex:postgres@db/worldex")

origins = [
    "https://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/h3_tiles/{z}/{x}/{y}")
async def get_h3_tiles(z: int, x: int, y: int):
    h3_resolution = get_h3_resolution(z)
    results = await database.fetch_all(f"""
        SELECT h3_polygon_to_cells(ST_Transform(ST_TileEnvelope({z}, {x}, {y}), 4326), {h3_resolution});
    """)
    return [{
        "index": result[0]
    } for result in results]

if __name__ == "__main__":
    uvicorn.run(app, port=8000, host='0.0.0.0')