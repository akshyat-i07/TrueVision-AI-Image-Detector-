"""Reproducible dataset loading with separate train, validation, and test sets."""

import os
from dataclasses import dataclass

import torch
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

IMG_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
EXPECTED_CLASS_TO_IDX = {"FAKE": 0, "REAL": 1}


@dataclass(frozen=True)
class DatasetSummary:
    train_samples: int
    validation_samples: int
    test_samples: int
    class_to_idx: dict[str, int]


def get_transforms(train: bool):
    steps = [transforms.Resize((IMG_SIZE, IMG_SIZE))]
    if train:
        steps += [
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
        ]
    steps += [
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ]
    return transforms.Compose(steps)


def _validate_classes(*datasets_to_validate: datasets.ImageFolder) -> None:
    for dataset in datasets_to_validate:
        if dataset.class_to_idx != EXPECTED_CLASS_TO_IDX:
            raise ValueError(
                "Unexpected class folder names/order: "
                f"{dataset.class_to_idx}; expected {EXPECTED_CLASS_TO_IDX}."
            )


def build_dataloaders(
    data_dir: str,
    batch_size: int = 32,
    num_workers: int = 2,
    validation_split: float = 0.1,
    seed: int = 42,
) -> tuple[DataLoader, DataLoader, DataLoader, DatasetSummary]:
    """Build deterministic train/validation/test loaders.

    ``data/test`` is never used for checkpoint selection. Validation samples
    are deterministically selected from ``data/train`` and use non-augmented
    transforms.
    """
    if not 0.0 < validation_split < 1.0:
        raise ValueError("validation_split must be between 0 and 1.")

    train_dir, test_dir = (os.path.join(data_dir, name) for name in ("train", "test"))
    for path in (train_dir, test_dir):
        if not os.path.isdir(path):
            raise FileNotFoundError(f"Expected dataset folder not found: {path}")

    # Separate ImageFolder instances ensure validation never receives training
    # augmentation even though both subsets point to the same source files.
    train_base = datasets.ImageFolder(train_dir, transform=get_transforms(train=True))
    validation_base = datasets.ImageFolder(train_dir, transform=get_transforms(train=False))
    test_dataset = datasets.ImageFolder(test_dir, transform=get_transforms(train=False))
    _validate_classes(train_base, validation_base, test_dataset)

    validation_size = round(len(train_base) * validation_split)
    if validation_size == 0 or validation_size == len(train_base):
        raise ValueError("validation_split produces an empty train or validation set.")
    generator = torch.Generator().manual_seed(seed)
    # Preserve the class balance in validation instead of relying on a random
    # split that can skew a small or imbalanced dataset.
    train_indices, validation_indices = [], []
    for class_id in sorted(set(train_base.targets)):
        class_indices = [i for i, target in enumerate(train_base.targets) if target == class_id]
        shuffled = torch.tensor(class_indices)[
            torch.randperm(len(class_indices), generator=generator)
        ].tolist()
        class_validation_size = round(len(shuffled) * validation_split)
        if class_validation_size == 0 or class_validation_size == len(shuffled):
            raise ValueError("Each class needs samples in both train and validation.")
        validation_indices.extend(shuffled[:class_validation_size])
        train_indices.extend(shuffled[class_validation_size:])

    train_dataset = Subset(train_base, train_indices)
    validation_dataset = Subset(validation_base, validation_indices)
    loader_options = {
        "batch_size": batch_size,
        "num_workers": num_workers,
        "pin_memory": torch.cuda.is_available(),
    }
    train_loader = DataLoader(train_dataset, shuffle=True, **loader_options)
    validation_loader = DataLoader(validation_dataset, shuffle=False, **loader_options)
    test_loader = DataLoader(test_dataset, shuffle=False, **loader_options)
    summary = DatasetSummary(
        train_samples=len(train_dataset),
        validation_samples=len(validation_dataset),
        test_samples=len(test_dataset),
        class_to_idx=train_base.class_to_idx,
    )
    return train_loader, validation_loader, test_loader, summary
