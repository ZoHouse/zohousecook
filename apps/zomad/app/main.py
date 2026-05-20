from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .db import init_db
from .log import configure_logging, logger
from .webhook import router as webhook_router

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    logger.info(
        "Zomad up — phone_number_id=%s db=%s model=%s",
        settings.META_PHONE_NUMBER_ID,
        settings.DB_PATH,
        settings.OPENAI_MODEL,
    )
    yield
    logger.info("Zomad shutting down")


app = FastAPI(title="Zomad", version="0.1.0", lifespan=lifespan)
app.include_router(webhook_router, prefix="/api")


@app.get("/")
async def root():
    return {"service": "zomad", "status": "ok", "scope": "WTFxZo"}


@app.get("/health")
async def health():
    return {"ok": True}
