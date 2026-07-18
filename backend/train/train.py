"""Train ResNet18 using validation-only checkpoint selection and final testing."""

import argparse
import os
import random
import sys
import time
from datetime import datetime, timezone

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.model import CHECKPOINT_PATH, CLASS_NAMES, build_model  # noqa: E402
from dataset import build_dataloaders  # noqa: E402


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def evaluate(model, loader, device) -> dict[str, float | list[list[int]]]:
    model.eval()
    correct = total = 0
    confusion = torch.zeros((len(CLASS_NAMES), len(CLASS_NAMES)), dtype=torch.int64)
    with torch.no_grad():
        for images, labels in loader:
            outputs = model(images.to(device))
            predictions = torch.argmax(outputs, dim=1).cpu()
            labels = labels.cpu()
            correct += (predictions == labels).sum().item()
            total += labels.numel()
            for actual, predicted in zip(labels.tolist(), predictions.tolist()):
                confusion[actual, predicted] += 1

    accuracy = correct / total if total else 0.0
    per_class = {}
    for class_id, class_name in enumerate(CLASS_NAMES):
        true_positive = int(confusion[class_id, class_id].item())
        false_positive = int(confusion[:, class_id].sum().item()) - true_positive
        false_negative = int(confusion[class_id, :].sum().item()) - true_positive
        precision = true_positive / (true_positive + false_positive) if true_positive + false_positive else 0.0
        recall = true_positive / (true_positive + false_negative) if true_positive + false_negative else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        per_class[class_name] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "support": int(confusion[class_id, :].sum().item()),
        }
    return {
        "accuracy": accuracy,
        "samples": total,
        "confusion_matrix": confusion.tolist(),
        "per_class": per_class,
    }


def save_checkpoint(model, *, epoch, validation_metrics, args, dataset_summary) -> None:
    checkpoint = {
        "state_dict": model.state_dict(),
        "architecture": "resnet18",
        "class_names": CLASS_NAMES,
        "image_size": 224,
        "normalization": {
            "mean": [0.485, 0.456, 0.406],
            "std": [0.229, 0.224, 0.225],
        },
        "epoch": epoch,
        "validation_metrics": validation_metrics,
        "training_config": vars(args),
        "dataset_summary": vars(dataset_summary),
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "torch_version": torch.__version__,
    }
    torch.save(checkpoint, CHECKPOINT_PATH)


def train(args):
    set_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[TrueVision] Training on device: {device}")
    train_loader, validation_loader, test_loader, summary = build_dataloaders(
        args.data_dir,
        batch_size=args.batch_size,
        validation_split=args.validation_split,
        seed=args.seed,
    )
    print(f"[TrueVision] Dataset: {summary}")
    print(f"[TrueVision] class_to_idx: {summary.class_to_idx}")

    model = build_model().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)
    best_validation_accuracy = -1.0
    os.makedirs(os.path.dirname(CHECKPOINT_PATH), exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        start = time.time()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)

        scheduler.step()
        validation_metrics = evaluate(model, validation_loader, device)
        train_loss = running_loss / len(train_loader.dataset)
        print(
            f"Epoch {epoch}/{args.epochs} | loss: {train_loss:.4f} | "
            f"val_acc: {validation_metrics['accuracy']:.4f} | "
            f"{time.time() - start:.1f}s"
        )
        if validation_metrics["accuracy"] > best_validation_accuracy:
            best_validation_accuracy = validation_metrics["accuracy"]
            save_checkpoint(
                model,
                epoch=epoch,
                validation_metrics=validation_metrics,
                args=args,
                dataset_summary=summary,
            )
            print(f"  -> New best model saved (val_acc={best_validation_accuracy:.4f})")

    # The test set is evaluated exactly once after all model-selection work.
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device, weights_only=True)
    model.load_state_dict(checkpoint["state_dict"])
    test_metrics = evaluate(model, test_loader, device)
    print(f"[TrueVision] Final held-out test metrics: {test_metrics}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train TrueVision's REAL vs FAKE classifier")
    parser.add_argument("--data-dir", required=True, help="Dataset root containing train/ and test/")
    parser.add_argument("--epochs", type=int, default=8)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--validation-split", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    train(parser.parse_args())
