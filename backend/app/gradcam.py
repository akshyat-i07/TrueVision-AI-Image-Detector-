"""
Grad-CAM heatmap generation for TrueVision.

Wraps `pytorch-grad-cam` to produce a heatmap overlay showing which regions
of an image most influenced the model's prediction.
"""

import numpy as np
import torch
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget


def generate_gradcam_overlay(
    model: torch.nn.Module,
    target_layers: list,
    input_tensor: torch.Tensor,
    rgb_image_float: np.ndarray,
    predicted_class_idx: int,
) -> np.ndarray:
    """
    Args:
        model: the loaded classifier (eval mode).
        target_layers: list of layers to hook for Grad-CAM (e.g. [model.layer4[-1]]).
        input_tensor: preprocessed (normalized) image tensor, shape (1, 3, H, W).
        rgb_image_float: the *unnormalized* RGB image as float32 in [0, 1],
            shape (H, W, 3). Used as the base for the visual overlay.
        predicted_class_idx: which class's activation map to visualize.

    Returns:
        np.ndarray uint8 RGB image (H, W, 3) — the heatmap overlaid on the
        original image.
    """
    targets = [ClassifierOutputTarget(predicted_class_idx)]

    with GradCAM(model=model, target_layers=target_layers) as cam:
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
        grayscale_cam = grayscale_cam[0, :]  # first (only) image in batch

    overlay = show_cam_on_image(rgb_image_float, grayscale_cam, use_rgb=True)
    return overlay
