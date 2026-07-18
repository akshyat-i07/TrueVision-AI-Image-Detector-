# TrueVision Frontend

React + Vite single-page app for the TrueVision AI image detector.

## Setup

```bash
npm install
cp .env.example .env    # adjust VITE_API_URL if your backend runs elsewhere
npm run dev
```

Runs at `http://localhost:5173` by default, expecting the backend API at
`http://localhost:8000` (see `../backend`).

## Build for production

```bash
npm run build
npm run preview
```
