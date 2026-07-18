from typing import Literal

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    label: Literal["REAL", "FAKE", "UNCERTAIN"]
    confidence: float | None  # 0-100 when the classifier verdict is shown
    heatmap: str | None        # base64 PNG data URL for classifier verdicts
    uncertainty_reason: str | None = None
    demo_mode: bool            # True if served by an untrained checkpoint
