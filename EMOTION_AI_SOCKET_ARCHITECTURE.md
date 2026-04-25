# Emotion AI Socket Architecture (SynCodex)

## Overview

This design uses a hybrid setup:

1. **React Frontend** captures mic audio chunks with `MediaRecorder`.
2. Chunks are streamed via **Socket.IO** event `audio_chunk` to a Python inference service.
3. **FastAPI + python-socketio** service preprocesses audio, runs PyTorch CNN+GRU inference, applies confidence filtering and temporal smoothing.
4. Service emits `emotion_result` back to frontend.
5. Frontend renders mood state (icon + label) in a status-bar Mood Widget.

## Components

- Python service: [cheating detection/inference_service.py](cheating%20detection/inference_service.py)
- Frontend streamer widget: [SynCodex Frontend/src/components/AudioStreamer.jsx](SynCodex%20Frontend/src/components/AudioStreamer.jsx)

## Real-Time Event Contract

### Client -> Server

- Event: `audio_chunk`
- Payload:
  - `audio`: Base64 Data URL (from MediaRecorder blob)
  - `mimeType`: e.g. `audio/webm;codecs=opus`
  - `ts`: timestamp

### Server -> Client

- Event: `emotion_result`
- Payload:
  - `emotion`: smoothed emotion label or null
  - `raw_emotion`: raw top-1 prediction before smoothing
  - `confidence`: top-1 confidence
  - `scores`: per-class probabilities
  - `status`: `accepted | ignored_low_confidence | ignored_silence | error`

## Inference Logic

- Model: PyTorch CNN+GRU (8-class RAVDESS emotion labels)
- Preprocess:
  - load audio at 16kHz
  - mel spectrogram (128 mel bins)
  - dB conversion + resize to `(128, 128)`
  - normalization `(spec + 80) / 80`
  - optional SpecAugment-style masking (frequency/time)
- Confidence threshold:
  - below threshold (default 0.70) => ignored
- Smoothing:
  - keep last 5 accepted predictions per session
  - emit majority-vote emotion

## Deployment Notes

- Run Python service on dedicated port (default `7001`) to isolate inference workload from Node backend.
- Configure frontend:
  - `VITE_EMOTION_WS_URL=http://localhost:7001`
- Configure model path:
  - `EMOTION_MODEL_PATH=/absolute/path/to/emotion_cnn_gru.pt`

## Minimal Run Commands

```bash
cd "cheating detection"
uvicorn inference_service:app --host 0.0.0.0 --port 7001
```

Then mount `AudioStreamer` in your editor layout/page component to show the Mood Widget.
