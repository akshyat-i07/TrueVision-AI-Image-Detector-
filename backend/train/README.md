# Training the TrueVision classifier

The API runs in "demo mode" out of the box (untrained head), so you can test
the whole app immediately. Follow these steps to train the real classifier
before your demo/submission.

## 1. Get the dataset

Recommended: **CIFAKE** (60,000 real + 60,000 AI-generated images,
Stable-Diffusion-based), available on Kaggle:
`https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images`

Download and extract it.

## 2. Arrange the folders

Rename/organize into exactly this structure (class folder names must match
case-sensitively):

```
data/
  train/
    REAL/
      img001.jpg
      ...
    FAKE/
      img001.jpg
      ...
  test/                 # held out until final evaluation
    REAL/
      ...
    FAKE/
      ...
```

Place this `data/` folder alongside (not inside) `backend/`, e.g.:

```
TrueVision/
├── backend/
├── frontend/
└── data/          <- here
```

## 3. Run training

```bash
cd backend
pip install -r requirements.txt   # if not already done
python train/train.py --data-dir ../data --epochs 8 --batch-size 32 --validation-split 0.1 --seed 42
```

Adjust `--epochs` and `--batch-size` based on your hardware. CIFAKE's
32x32 source images get upscaled to 224x224 for the ResNet18 backbone —
training on CPU will be slow; a GPU (even a free Colab one) is recommended
if available.

## 4. Done

The training directory is split deterministically into training and validation
sets. The best checkpoint (by validation accuracy) is saved automatically to
`backend/app/models/truevision_resnet18.pth`. Restart the API
(`uvicorn app.main:app --reload --port 8000`) and it will load
automatically — the `/health` endpoint's `demo_mode` field will now read
`false`.

## Notes for your report

- The supplied `test/` directory is evaluated exactly once after checkpoint
  selection. Do not use it to select epochs or tune hyperparameters.
- The checkpoint stores its architecture, label mapping, transforms, seed, and
  validation metrics alongside the weights for reproducibility.
- Worth reporting: final train/validation/test accuracy, a confusion matrix, and a few
  example Grad-CAM outputs (correct and incorrect predictions) — this makes
  for a much stronger evaluation section than accuracy alone.
- If you want to compare backbones, swapping `resnet18` for e.g.
  `efficientnet_b0` in `app/model.py` and `get_target_layer` is
  straightforward and gives you a second data point to discuss.
