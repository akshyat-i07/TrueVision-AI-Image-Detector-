"""
Model definition for TrueVision's Real vs. AI-generated image classifier.

Architecture: ResNet18 (ImageNet-pretrained backbone) with the final
fully-connected layer replaced by a 2-class head (FAKE, REAL), matching
torchvision's alphabetical ImageFolder class ordering.
"""

import logging
import os
from typing import Any
import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights

CLASS_NAMES = ["FAKE", "REAL"]
logger = logging.getLogger(__name__)

CHECKPOINT_PATH = os.path.join(
    os.path.dirname(__file__), "models", "truevision_resnet18.pth"
)


def build_model(use_pretrained_weights: bool = True) -> nn.Module:
    """Builds a ResNet18 with a 2-class classification head."""
    weights = ResNet18_Weights.IMAGENET1K_V1 if use_pretrained_weights else None
    model = resnet18(weights=weights)
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, len(CLASS_NAMES))
    return model


def load_model(device: torch.device) -> tuple[nn.Module, bool]:
    """
    Loads the model, returning (model, is_trained_checkpoint).

    If a fine-tuned checkpoint exists at CHECKPOINT_PATH, it is loaded.
    Otherwise the function falls back to the ImageNet-pretrained backbone
    with a freshly initialized (untrained) classification head, so the API
    can still be run and tested end-to-end ("demo mode").
    """
    if os.path.exists(CHECKPOINT_PATH):
        model = build_model(use_pretrained_weights=False)
        checkpoint: dict[str, Any] = torch.load(
            CHECKPOINT_PATH, map_location=device, weights_only=True
        )
        # Support the original weight-only checkpoint as well as the
        # metadata-rich checkpoints produced by the current training script.
        state_dict = checkpoint.get("state_dict", checkpoint)
        checkpoint_classes = checkpoint.get("class_names")
        if checkpoint_classes is not None and checkpoint_classes != CLASS_NAMES:
            raise ValueError(
                "Checkpoint class names do not match the API class mapping: "
                f"{checkpoint_classes!r} != {CLASS_NAMES!r}"
            )
        if checkpoint_classes is None:
            # The shipped checkpoint predates the metadata-rich format.  Its
            # mapping is verified empirically against data/test, but a future
            # checkpoint must carry this metadata to be self-describing.
            logger.warning(
                "Loading legacy checkpoint without class metadata from %s. "
                "Expected mapping is %s; retrain to produce a self-describing checkpoint.",
                os.path.abspath(CHECKPOINT_PATH),
                CLASS_NAMES,
            )

        fc_weight = state_dict.get("fc.weight")
        fc_bias = state_dict.get("fc.bias")
        if (
            fc_weight is None
            or fc_bias is None
            or tuple(fc_weight.shape) != (len(CLASS_NAMES), model.fc.in_features)
            or tuple(fc_bias.shape) != (len(CLASS_NAMES),)
        ):
            raise ValueError(
                "Checkpoint does not contain the expected two-logit ResNet18 "
                f"classification head for {CLASS_NAMES}: {os.path.abspath(CHECKPOINT_PATH)}"
            )
        model.load_state_dict(state_dict, strict=True)
        is_trained = True
        logger.info(
            "Loaded trained TrueVision checkpoint from %s (classes=%s, metadata=%s).",
            os.path.abspath(CHECKPOINT_PATH),
            CLASS_NAMES,
            "present" if checkpoint_classes is not None else "legacy/absent",
        )
    else:
        try:
            model = build_model(use_pretrained_weights=True)
        except Exception:
            logger.warning("ImageNet weights unavailable; using a fully untrained demo model.")
            model = build_model(use_pretrained_weights=False)
        is_trained = False
        print(
            "[TrueVision] WARNING: no trained checkpoint found at "
            f"{CHECKPOINT_PATH}. Running in DEMO MODE with an untrained "
            "classification head — predictions will not be meaningful. "
            "See backend/train/README.md to train the real model."
        )

    model.to(device)
    model.eval()
    return model, is_trained


# The last convolutional block, used as the Grad-CAM target layer.
def get_target_layer(model: nn.Module):
    return [model.layer4[-1]]
