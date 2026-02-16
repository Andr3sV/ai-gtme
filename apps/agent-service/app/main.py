import os
from pathlib import Path

from dotenv import load_dotenv

# Cargar .env desde el directorio del agent-service (no depende del cwd)
_env_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_env_dir / ".env", override=True)

# Asegurar que GOOGLE_APPLICATION_CREDENTIALS sea ruta absoluta (expandir ~)
creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
if creds:
    creds = os.path.abspath(os.path.expanduser(creds))
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds
    if not os.path.isfile(creds):
        import warnings
        warnings.warn(
            f"GOOGLE_APPLICATION_CREDENTIALS: archivo no encontrado: {creds}. "
            "Revisá la ruta en apps/agent-service/.env"
        )

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
