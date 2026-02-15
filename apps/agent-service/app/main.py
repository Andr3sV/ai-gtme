from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import run as run_router

app = FastAPI(title="GTME Agent Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(run_router.router, prefix="/run", tags=["run"])


@app.get("/health")
def health():
    return {"status": "ok"}
