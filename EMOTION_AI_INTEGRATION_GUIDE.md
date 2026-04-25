# Emotion AI Integration Guide (SynCodex)

## 1) EmotionAI repo analysis and extraction

From `Tirovo/EmotionAI-voice`, the reusable inference core is:

- Audio preprocessing: load waveform at `sr=16000`
- Feature extraction: `mel_spectrogram(n_mels=128, hop_length=512)`
- Conversion: `power_to_db`
- Resize rule: force `(128, 128)` by right-padding with `-80` dB or truncating time axis
- Normalization: `(spec + 80) / 80`
- Model output: 8-class logits → softmax probabilities:
  - `neutral, calm, happy, sad, angry, fearful, disgust, surprised`

This is implemented for production inference in:

- `cheating detection/emotion_inference.py`

## 2) SynCodex architecture

### Frontend capture (Web Audio API)

- Component: `SynCodex Frontend/src/components/EmotionMonitor.jsx`
- Explicit consent flow: user must click `Enable Mic`
- Streaming approach: `MediaRecorder.start(chunkMs)` sends periodic chunks for inference

### Backend private-session inference bridge

- API endpoint: `POST /api/emotion/infer`
- Route/controller files:
  - `SynCodex Backend/src/routes/emotionRoutes.js`
  - `SynCodex Backend/src/controllers/emotionController.js`
  - `SynCodex Backend/src/services/emotionInferenceBridge.js`
- Bridge behavior:
  - receives base64 audio chunk
  - writes ephemeral temp file
  - invokes local python process (`emotion_inference.py`)
  - deletes temp file immediately after inference

### Health Dashboard integration

- Global state store: `SynCodex Frontend/src/stores/healthStore.js`
- Dashboard card: `SynCodex Frontend/src/components/dashboard/HealthDashboardCard.jsx`
- Trigger logic:
  - emotion bucket `stressed` if emotion in `{angry, fearful, sad}`
  - if confidence threshold and cooldown pass, fire break reminder toast

## 3) Privacy model

- Microphone access is explicit and reversible (Start/Stop)
- Audio chunks are processed in private local session
- No persistent audio storage in backend bridge
- You can pin everything to localhost by using local API base URL and local python runtime

## 4) Performance strategy

Recommended modes:

- Mode A (default): local Python inference per chunk, 3–5s chunk interval
- Mode B (advanced): convert model to TF.js and run inference in browser WebWorker

Practical tuning knobs:

- `chunkMs` increase to reduce CPU load
- cooldown in `healthStore` to avoid reminder spam
- keep model on CPU unless dedicated inference GPU exists

## 5) Env setup

Backend optional env vars:

- `PYTHON_BIN` (default `python3`)
- `EMOTION_MODEL_PATH` (path to EmotionAI `.pt` weights)

If no model path is provided, the python adapter uses a heuristic fallback so UI still works end-to-end.
