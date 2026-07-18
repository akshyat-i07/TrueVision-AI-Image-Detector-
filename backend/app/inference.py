"""
End-to-end inference pipeline: raw image bytes -> prediction + Grad-CAM
heatmap, ready to be returned by the API.
"""

import base64
import io
import logging

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from app.gradcam import generate_gradcam_overlay
from app.model import CLASS_NAMES, get_target_layer

logger = logging.getLogger(__name__)

IMG_SIZE = 224
MAX_IMAGE_PIXELS = 40_000_000
# CIFAKE is a photographic dataset. Extremely wide/tall images are commonly
# banners, screenshots, or layouts rather than the photographic inputs on
# which this classifier was trained, so abstain instead of making up a verdict.
MIN_SUPPORTED_ASPECT_RATIO = 0.5
MAX_SUPPORTED_ASPECT_RATIO = 2.0

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

_preprocess = transforms.Compose(
    [
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]
)


def _pil_to_float_rgb(image: Image.Image) -> np.ndarray:
    """Resizes and converts a PIL image to a float32 RGB array in [0, 1],
    matching the size Grad-CAM will operate at."""
    resized = image.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(resized).astype(np.float32) / 255.0
    if arr.ndim == 2:  # grayscale safety net
        arr = np.stack([arr] * 3, axis=-1)
    return arr[:, :, :3]


def _encode_image_to_base64(image_array: np.ndarray) -> str:
    """Encodes a uint8 RGB numpy array as a base64 PNG data URL."""
    image = Image.fromarray(image_array)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def validate_image_bytes(image_bytes: bytes, max_pixels: int = MAX_IMAGE_PIXELS) -> None:
    """Reject corrupt and excessively large decoded images before inference."""
    with Image.open(io.BytesIO(image_bytes)) as image:
        image.verify()

    # ``verify`` intentionally invalidates the image object, so reopen it to
    # safely inspect its dimensions.
    with Image.open(io.BytesIO(image_bytes)) as image:
        width, height = image.size
        if width <= 0 or height <= 0 or width * height > max_pixels:
            raise ValueError(
                f"Image dimensions exceed the {max_pixels:,}-pixel limit."
            )


def is_supported_photographic_aspect_ratio(width: int, height: int) -> bool:
    """Return whether an image shape is inside the validated photo-like range."""
    if width <= 0 or height <= 0:
        return False
    aspect_ratio = width / height
    return MIN_SUPPORTED_ASPECT_RATIO <= aspect_ratio <= MAX_SUPPORTED_ASPECT_RATIO


def predict(
    model,
    device: torch.device,
    image_bytes: bytes,
    source_name: str | None = None,
) -> dict:
    """
    Runs the full pipeline on a single uploaded image.

    Returns a dict with:
        - label: "REAL", "FAKE", or "UNCERTAIN"
        - confidence: float 0-100 for a classifier verdict, otherwise None
        - heatmap: base64 PNG data URL for a classifier verdict, otherwise None
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = image.size
    if not is_supported_photographic_aspect_ratio(width, height):
        aspect_ratio = width / height
        reason = (
            "This image has a banner-like aspect ratio and is outside the "
            "photographic image range on which the current model was validated."
        )
        logger.info(
            "Inference source=%r image_size=%sx%s aspect_ratio=%.3f "
            "label=UNCERTAIN reason=%s",
            source_name,
            width,
            height,
            aspect_ratio,
            reason,
        )
        return {
            "label": "UNCERTAIN",
            "confidence": None,
            "heatmap": None,
            "uncertainty_reason": reason,
        }

    input_tensor = _preprocess(image).unsqueeze(0).to(device)
    rgb_float = _pil_to_float_rgb(image)

    with torch.no_grad():
        logits = model(input_tensor)
        if logits.shape != (1, len(CLASS_NAMES)) or not torch.isfinite(logits).all():
            raise ValueError(
                "Model returned invalid logits: "
                f"shape={tuple(logits.shape)}, finite={bool(torch.isfinite(logits).all())}"
            )
        probs = F.softmax(logits, dim=1)[0]
        predicted_idx = int(torch.argmax(probs).item())
        confidence = float(probs[predicted_idx].item()) * 100.0

    logger.info(
        "Inference source=%r input_shape=%s input_min=%.6f input_max=%.6f "
        "input_mean=%.6f logits=%s probabilities=%s predicted_idx=%d "
        "label=%s confidence=%.2f",
        source_name,
        tuple(input_tensor.shape),
        float(input_tensor.min().item()),
        float(input_tensor.max().item()),
        float(input_tensor.mean().item()),
        [round(float(value), 6) for value in logits[0].detach().cpu()],
        [round(float(value), 6) for value in probs.detach().cpu()],
        predicted_idx,
        CLASS_NAMES[predicted_idx],
        confidence,
    )

    target_layers = get_target_layer(model)
    heatmap_array = generate_gradcam_overlay(
        model=model,
        target_layers=target_layers,
        input_tensor=input_tensor,
        rgb_image_float=rgb_float,
        predicted_class_idx=predicted_idx,
    )

    return {
        "label": CLASS_NAMES[predicted_idx],
        "confidence": round(confidence, 2),
        "heatmap": _encode_image_to_base64(heatmap_array),
        "uncertainty_reason": None,
    }
