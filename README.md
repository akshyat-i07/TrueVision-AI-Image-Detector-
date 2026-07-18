# TrueVision - Explainable AI Image Detector

TrueVision is a full-stack, explainable image-authenticity project. It is
trained to distinguish **CIFAKE-style real photographs** from
**CIFAKE-style AI-generated photographs**, and explains each model decision
with Grad-CAM visual heatmaps.

> **Scope notice:** this is not a universal detector for every type of
> AI-created content. Its predictions are most meaningful for photographic
> images similar to its training data. AI artwork, LinkedIn banners,
> infographics, UI mockups, illustrations, screenshots, and outputs from
> unseen generators can be outside that distribution and may be classified
> incorrectly with high softmax confidence.

```
TrueVision/
├── backend/     FastAPI + PyTorch inference service
├── frontend/    React (Vite) single-page detector UI
└── README.md    Project documentation
```

## How it fits together

1. The **frontend** lets a user upload an image and shows the prediction,
   confidence score, and Grad-CAM heatmap.
2. The **backend** exposes `POST /predict`, loads a fine-tuned ResNet18,
   runs inference, and creates the Grad-CAM overlay.
3. The **training scripts** in `backend/train/` create the checkpoint used by
   the API.

## Intended use and limitations

Use TrueVision as a research/demo detector for real-versus-AI photographic
images in a CIFAKE-like distribution. A `REAL` or `FAKE` result is the
classifier's prediction, not proof of an image's provenance.

The current model should **not** be used for high-stakes, forensic, or
moderation decisions. It has not been validated as a detector for all
generators or non-photographic designs. Softmax confidence measures the
model's preference between its two learned classes; it is not a guarantee
that an unfamiliar input belongs to the model's training distribution.

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`; interactive documentation is at
`http://localhost:8000/docs`.

For a separately deployed frontend, set `TRUEVISION_ALLOWED_ORIGINS` to a
comma-separated allow-list of exact HTTPS origins. Do not use `*` in
production.

**Demo mode:** without a checkpoint at
`backend/app/models/truevision_resnet18.pth`, the server starts with an
untrained classification head. Its predictions are illustrative only.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Set `VITE_API_URL` at build time when the
frontend calls a separately deployed API.

### 3. Train the model

See `backend/train/README.md` for full instructions. In short:

1. Download the **CIFAKE** dataset.
2. Arrange it as:

   ```text
   data/
     train/REAL/...
     train/FAKE/...
     test/REAL/...
     test/FAKE/...
   ```

3. Run:

   ```bash
   cd backend
   python train/train.py --data-dir ../data --epochs 8
   ```

4. The checkpoint is saved to
   `backend/app/models/truevision_resnet18.pth` and is loaded on the next
   backend restart.

To support AI-created design graphics, build a separate representative
dataset. Include both AI-generated and human-created banners, posters,
infographics, illustrations, and UI designs. Split by source or generator to
prevent near-duplicate leakage between training and testing, then report
results on a held-out graphics test set before claiming support for that
content type.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide icons
- **Backend:** FastAPI, PyTorch, torchvision, Grad-CAM
- **Model:** ResNet18 binary classifier (FAKE / REAL)

## Verification

Run backend boundary tests:

```bash
cd backend
python -m unittest discover -s tests -v
```

Build the production frontend:

```bash
cd frontend
npm run build
```

## Notes for a report or demo

- The classifier uses ImageNet-pretrained ResNet18 transfer learning.
- Grad-CAM uses the last convolutional block (`layer4`) to visualize regions
  that influenced the predicted class.
- Describe the project accurately as **an explainable CIFAKE-style
  photographic real-versus-AI classifier**, not a universal AI-image
  detector.
- A model trained primarily on one generator's photographic outputs can
  generalize poorly to other generators, AI artwork, banners, UI designs,
  screenshots, and other non-photographic content. This is a dataset/model
  limitation that must be stated clearly.
