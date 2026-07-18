"""Dependency-free API boundary tests runnable with ``python -m unittest``."""

import asyncio
import unittest
from io import BytesIO
from unittest.mock import patch

from fastapi import HTTPException, UploadFile
from PIL import Image
from starlette.datastructures import Headers

from app.inference import is_supported_photographic_aspect_ratio, validate_image_bytes
from app.main import predict_image

def valid_png() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
    return buffer.getvalue()


def upload(filename: str, content: bytes, content_type: str) -> UploadFile:
    return UploadFile(filename=filename, file=BytesIO(content), headers=Headers({"content-type": content_type}))


class PredictionEndpointTests(unittest.TestCase):
    def test_rejects_unsupported_content_type(self):
        with self.assertRaises(HTTPException) as error:
            asyncio.run(predict_image(upload("notes.txt", b"hello", "text/plain")))
        self.assertEqual(error.exception.status_code, 400)

    def test_rejects_corrupt_image_bytes(self):
        with self.assertRaises(HTTPException) as error:
            asyncio.run(predict_image(upload("bad.jpg", b"not an image", "image/jpeg")))
        self.assertEqual(error.exception.status_code, 400)

    def test_returns_prediction_contract(self):
        fake_result = {"label": "REAL", "confidence": 98.5, "heatmap": "data:image/png;base64,abc"}
        with patch("app.main.predict", return_value=fake_result):
            result = asyncio.run(predict_image(upload("pixel.png", valid_png(), "image/png")))
        self.assertEqual(result.label, "REAL")
        self.assertEqual(result.confidence, 98.5)
        self.assertFalse(result.demo_mode)

    def test_pixel_limit_rejects_large_dimensions(self):
        with self.assertRaises(ValueError):
            validate_image_bytes(valid_png(), max_pixels=0)

    def test_banner_aspect_ratio_is_marked_outside_supported_scope(self):
        self.assertFalse(is_supported_photographic_aspect_ratio(1983, 793))
        self.assertTrue(is_supported_photographic_aspect_ratio(1600, 900))


if __name__ == "__main__":
    unittest.main()
