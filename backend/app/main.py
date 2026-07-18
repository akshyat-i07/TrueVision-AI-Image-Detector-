"""
TrueVision backend — FastAPI service for AI-generated image detection.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import logging
import os

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.inference import predict, validate_image_bytes
from app.model import load_model
from app.schemas import PredictionResponse

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
logging.basicConfig(
    level=os.getenv("TRUEVISION_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
DEFAULT_ALLOWED_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("TRUEVISION_ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(
    title="TrueVision API",
    description="Detects whether an image is real or AI-generated, with Grad-CAM explainability.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model, is_trained_checkpoint = load_model(device)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "device": str(device),
        "demo_mode": not is_trained_checkpoint,
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Use JPEG, PNG, or WebP.",
        )

    image_bytes = await file.read(MAX_FILE_SIZE_BYTES + 1)

    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MAX_FILE_SIZE_MB} MB.",
        )
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        validate_image_bytes(image_bytes)
        result = predict(model, device, image_bytes, source_name=file.filename)
    except (OSError, ValueError, SyntaxError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Inference failed")
        raise HTTPException(status_code=500, detail="Image analysis failed. Please try again.") from exc

    return PredictionResponse(
        label=result["label"],
        confidence=result["confidence"],
        heatmap=result["heatmap"],
        uncertainty_reason=result.get("uncertainty_reason"),
        demo_mode=not is_trained_checkpoint,
    )
