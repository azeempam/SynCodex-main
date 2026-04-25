"""
Real-time Emotion Recognition Service (PyTorch + FastAPI + Socket.IO)

Run:
    pip install fastapi uvicorn python-socketio numpy torch librosa soundfile
    uvicorn inference_service:app --host 0.0.0.0 --port 7001

Environment variables:
    EMOTION_MODEL_PATH=./models/emotion_cnn_gru.pt
    EMOTION_CONF_THRESHOLD=0.70
    EMOTION_USE_SPEC_AUG=true
"""

from __future__ import annotations

import asyncio
import base64
import io
import os
import random
import tempfile
from collections import Counter, defaultdict, deque
from typing import Deque, Dict, Optional, Tuple

import librosa
import numpy as np
import socketio
import torch
import torch.nn as nn
import torch.nn.functional as F
from fastapi import FastAPI


EMOTION_LABELS = [
    "neutral",
    "calm",
    "happy",
    "sad",
    "angry",
    "fearful",
    "disgust",
    "surprised",
]

SAMPLE_RATE = 16000
N_MELS = 128
HOP_LENGTH = 512
TARGET_SHAPE = (128, 128)

CONF_THRESHOLD = float(os.getenv("EMOTION_CONF_THRESHOLD", "0.70"))
USE_SPEC_AUG = os.getenv("EMOTION_USE_SPEC_AUG", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}


class SpecAugmentTransform:
    def __init__(self, freq_mask_param: int = 8, time_mask_param: int = 12, num_masks: int = 1):
        self.freq_mask_param = freq_mask_param
        self.time_mask_param = time_mask_param
        self.num_masks = num_masks

    def __call__(self, spec: torch.Tensor) -> torch.Tensor:
        # spec shape: (1, 128, 128)
        cloned = spec.clone()
        _, freq_dim, time_dim = cloned.shape

        for _ in range(self.num_masks):
            f = random.randint(0, self.freq_mask_param)
            if f > 0 and freq_dim - f > 0:
                f0 = random.randint(0, freq_dim - f)
                cloned[0, f0 : f0 + f, :] = 0

        for _ in range(self.num_masks):
            t = random.randint(0, self.time_mask_param)
            if t > 0 and time_dim - t > 0:
                t0 = random.randint(0, time_dim - t)
                cloned[0, :, t0 : t0 + t] = 0

        return cloned


class EmotionCNN_GRU(nn.Module):
    def __init__(self, num_classes: int = 8):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.gru = nn.GRU(
            input_size=32,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            dropout=0.3,
            bidirectional=True,
        )
        self.dropout = nn.Dropout(0.4)
        self.fc = nn.Sequential(
            nn.Linear(128 * 2, 64),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(64, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.cnn(x)
        x = x.mean(dim=2)
        x = x.permute(0, 2, 1)
        _, h = self.gru(x)
        h_last = torch.cat([h[-2], h[-1]], dim=1)
        h_last = self.dropout(h_last)
        return self.fc(h_last)


def resize_spectrogram(spec: np.ndarray, target_shape: Tuple[int, int]) -> np.ndarray:
    _, w = spec.shape
    _, tw = target_shape
    if w < tw:
        spec = np.pad(spec, ((0, 0), (0, tw - w)), mode="constant", constant_values=-80)
    elif w > tw:
        spec = spec[:, :tw]
    return spec


def decode_audio_bytes(audio_bytes: bytes, mime_type: Optional[str]) -> np.ndarray:
    if not audio_bytes:
        return np.array([], dtype=np.float32)

    suffix = ".wav"
    if mime_type:
        lowered = mime_type.lower()
        if "webm" in lowered:
            suffix = ".webm"
        elif "ogg" in lowered:
            suffix = ".ogg"
        elif "mpeg" in lowered or "mp3" in lowered:
            suffix = ".mp3"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(audio_bytes)
        temp_path = temp_file.name

    try:
        y, sr = librosa.load(temp_path, sr=SAMPLE_RATE, mono=True)
        return y.astype(np.float32)
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


def build_input_tensor(y: np.ndarray) -> torch.Tensor:
    mel = librosa.feature.melspectrogram(y=y, sr=SAMPLE_RATE, n_mels=N_MELS, hop_length=HOP_LENGTH)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_fixed = resize_spectrogram(mel_db, TARGET_SHAPE)
    mel_norm = (mel_fixed + 80.0) / 80.0
    tensor = torch.tensor(mel_norm, dtype=torch.float32).unsqueeze(0)
    if USE_SPEC_AUG:
        tensor = SPEC_AUG(tensor)
    return tensor.unsqueeze(0)


def parse_chunk_payload(data: Dict) -> Tuple[bytes, Optional[str]]:
    audio_payload = data.get("audio")
    mime_type = data.get("mimeType")

    if audio_payload is None:
        raise ValueError("Missing 'audio' in payload")

    if isinstance(audio_payload, str):
        if audio_payload.startswith("data:"):
            _, raw_base64 = audio_payload.split(",", 1)
            return base64.b64decode(raw_base64), mime_type
        return base64.b64decode(audio_payload), mime_type

    if isinstance(audio_payload, (bytes, bytearray)):
        return bytes(audio_payload), mime_type

    raise ValueError("Unsupported audio payload type")


def smooth_emotion(history: Deque[str], fallback: str) -> str:
    if not history:
        return fallback
    return Counter(history).most_common(1)[0][0]


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = os.getenv("EMOTION_MODEL_PATH", "")
MODEL = EmotionCNN_GRU(num_classes=8).to(DEVICE)
SPEC_AUG = SpecAugmentTransform()

if MODEL_PATH and os.path.exists(MODEL_PATH):
    state = torch.load(MODEL_PATH, map_location=DEVICE)
    MODEL.load_state_dict(state)
MODEL.eval()

SESSION_MEMORY: Dict[str, Deque[str]] = defaultdict(lambda: deque(maxlen=5))

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
fastapi_app = FastAPI(title="SynCodex Emotion Inference Service")
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


@fastapi_app.get("/health")
async def health() -> Dict:
    return {
        "ok": True,
        "device": str(DEVICE),
        "model_loaded": bool(MODEL_PATH and os.path.exists(MODEL_PATH)),
        "confidence_threshold": CONF_THRESHOLD,
        "spec_augment_enabled": USE_SPEC_AUG,
        "labels": EMOTION_LABELS,
    }


@sio.event
async def connect(sid, environ):
    await sio.emit("service_status", {"status": "connected", "sid": sid}, to=sid)


@sio.event
async def disconnect(sid):
    SESSION_MEMORY.pop(sid, None)


@sio.on("audio_chunk")
async def audio_chunk(sid, data):
    try:
        audio_bytes, mime_type = parse_chunk_payload(data)
        y = await asyncio.to_thread(decode_audio_bytes, audio_bytes, mime_type)

        if y.size == 0 or np.max(np.abs(y)) < 1e-4:
            await sio.emit(
                "emotion_result",
                {
                    "emotion": None,
                    "confidence": 0.0,
                    "status": "ignored_silence",
                    "message": "No speech content detected",
                },
                to=sid,
            )
            return

        x = await asyncio.to_thread(build_input_tensor, y)
        x = x.to(DEVICE)

        with torch.no_grad():
            logits = MODEL(x)
            probs = torch.softmax(logits, dim=1).squeeze(0).detach().cpu().numpy()

        best_idx = int(np.argmax(probs))
        raw_emotion = EMOTION_LABELS[best_idx]
        confidence = float(probs[best_idx])

        if confidence < CONF_THRESHOLD:
            current = smooth_emotion(SESSION_MEMORY[sid], "neutral")
            await sio.emit(
                "emotion_result",
                {
                    "emotion": current,
                    "raw_emotion": raw_emotion,
                    "confidence": confidence,
                    "status": "ignored_low_confidence",
                    "threshold": CONF_THRESHOLD,
                },
                to=sid,
            )
            return

        SESSION_MEMORY[sid].append(raw_emotion)
        smoothed = smooth_emotion(SESSION_MEMORY[sid], raw_emotion)

        await sio.emit(
            "emotion_result",
            {
                "emotion": smoothed,
                "raw_emotion": raw_emotion,
                "confidence": confidence,
                "scores": {EMOTION_LABELS[i]: float(probs[i]) for i in range(len(EMOTION_LABELS))},
                "status": "accepted",
            },
            to=sid,
        )
    except Exception as exc:
        await sio.emit(
            "emotion_result",
            {
                "emotion": None,
                "confidence": 0.0,
                "status": "error",
                "error": str(exc),
            },
            to=sid,
        )
