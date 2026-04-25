"""
Robust Speech Emotion Recognition (SER) pipeline for SynCodex.

Features implemented:
1) Noise reduction via spectral gating
2) RMS volume normalization
3) Silence removal gate
4) MFCC extraction at 16kHz
5) Sliding-window inference (3s, 50% overlap)
6) Confidence filtering (< 0.70 ignored)
7) Short-term memory smoothing (last 5 accepted frames)

Dependencies:
    pip install numpy scipy librosa tensorflow soundfile
"""

from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import librosa
import numpy as np
import tensorflow as tf
from scipy.signal import lfilter


@dataclass
class SERConfig:
    sample_rate: int = 16000
    chunk_seconds: float = 3.0
    overlap_ratio: float = 0.5
    confidence_threshold: float = 0.70
    memory_size: int = 5

    target_dbfs: float = -20.0
    silence_db_threshold: float = -45.0
    min_speech_ms: int = 200

    n_mfcc: int = 40
    n_fft: int = 400
    win_length: int = 400
    hop_length: int = 160
    n_mels: int = 64

    pre_emphasis: float = 0.97


class RobustSERPipeline:
    def __init__(
        self,
        model_path: str,
        labels: List[str],
        config: SERConfig = SERConfig(),
    ) -> None:
        self.cfg = config
        self.labels = labels
        self.model = tf.keras.models.load_model(model_path)
        self.memory = deque(maxlen=self.cfg.memory_size)

    def load_audio(self, audio_path: str) -> np.ndarray:
        y, sr = librosa.load(audio_path, sr=None, mono=True)
        if sr != self.cfg.sample_rate:
            y = librosa.resample(y, orig_sr=sr, target_sr=self.cfg.sample_rate)
        return y.astype(np.float32)

    def preprocess(self, y: np.ndarray) -> np.ndarray:
        if y.size == 0:
            return y

        y = self._pre_emphasis(y)
        y = self._spectral_gating(y)
        y = self._rms_normalize(y, target_dbfs=self.cfg.target_dbfs)
        y = self._remove_silence(
            y,
            db_threshold=self.cfg.silence_db_threshold,
            min_speech_ms=self.cfg.min_speech_ms,
        )
        return y.astype(np.float32)

    def extract_mfcc(self, y: np.ndarray) -> np.ndarray:
        mfcc = librosa.feature.mfcc(
            y=y,
            sr=self.cfg.sample_rate,
            n_mfcc=self.cfg.n_mfcc,
            n_fft=self.cfg.n_fft,
            hop_length=self.cfg.hop_length,
            win_length=self.cfg.win_length,
            n_mels=self.cfg.n_mels,
        )

        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        feats = np.vstack([mfcc, delta, delta2])

        feats = (feats - np.mean(feats)) / (np.std(feats) + 1e-8)
        return feats.astype(np.float32)

    def sliding_window_predict(self, y: np.ndarray) -> List[Dict]:
        chunk_size = int(self.cfg.chunk_seconds * self.cfg.sample_rate)
        hop_size = int(chunk_size * (1.0 - self.cfg.overlap_ratio))
        hop_size = max(1, hop_size)

        results: List[Dict] = []
        if y.size < chunk_size:
            y = np.pad(y, (0, chunk_size - y.size), mode="constant")

        for start in range(0, max(1, len(y) - chunk_size + 1), hop_size):
            end = start + chunk_size
            chunk = y[start:end]
            if len(chunk) < chunk_size:
                chunk = np.pad(chunk, (0, chunk_size - len(chunk)), mode="constant")

            pre = self.preprocess(chunk)
            if pre.size < int(0.25 * self.cfg.sample_rate):
                results.append(
                    {
                        "start_sec": start / self.cfg.sample_rate,
                        "end_sec": end / self.cfg.sample_rate,
                        "emotion": None,
                        "confidence": 0.0,
                        "status": "ignored_silence",
                    }
                )
                continue

            pred = self._predict_chunk(pre)

            if pred["confidence"] < self.cfg.confidence_threshold:
                results.append(
                    {
                        "start_sec": start / self.cfg.sample_rate,
                        "end_sec": end / self.cfg.sample_rate,
                        "emotion": None,
                        "confidence": pred["confidence"],
                        "status": "ignored_low_confidence",
                        "raw_emotion": pred["emotion"],
                    }
                )
                continue

            self.memory.append(pred["emotion"])
            smoothed = self._smoothed_emotion(pred["emotion"])

            results.append(
                {
                    "start_sec": start / self.cfg.sample_rate,
                    "end_sec": end / self.cfg.sample_rate,
                    "emotion": smoothed,
                    "confidence": pred["confidence"],
                    "status": "accepted",
                    "raw_emotion": pred["emotion"],
                    "scores": pred["scores"],
                }
            )

        return results

    def _predict_chunk(self, y: np.ndarray) -> Dict:
        feats = self.extract_mfcc(y)

        expected = self.model.input_shape
        x = self._adapt_to_model_input(feats, expected)

        probs = self.model.predict(x, verbose=0)[0]
        probs = np.asarray(probs, dtype=np.float32)
        probs = probs / (np.sum(probs) + 1e-8)

        idx = int(np.argmax(probs))
        emotion = self.labels[idx] if idx < len(self.labels) else str(idx)

        return {
            "emotion": emotion,
            "confidence": float(probs[idx]),
            "scores": {self.labels[i]: float(probs[i]) for i in range(min(len(self.labels), len(probs)))},
        }

    def _adapt_to_model_input(self, feats: np.ndarray, input_shape: Tuple) -> np.ndarray:
        if len(input_shape) != 4 and len(input_shape) != 3:
            raise ValueError(f"Unsupported input shape: {input_shape}")

        feat_dim, time_dim = feats.shape

        if len(input_shape) == 4:
            _, d1, d2, channels = input_shape
            if channels != 1:
                raise ValueError("Expected single-channel model input")

            target_h = d1 if d1 is not None else feat_dim
            target_w = d2 if d2 is not None else time_dim
            x = self._pad_or_crop_2d(feats, target_h, target_w)
            return np.expand_dims(np.expand_dims(x, axis=0), axis=-1).astype(np.float32)

        _, t, f = input_shape
        target_t = t if t is not None else time_dim
        target_f = f if f is not None else feat_dim
        x = self._pad_or_crop_2d(feats, target_f, target_t).T
        return np.expand_dims(x, axis=0).astype(np.float32)

    @staticmethod
    def _pad_or_crop_2d(x: np.ndarray, target_h: int, target_w: int) -> np.ndarray:
        h, w = x.shape
        y = x

        if h < target_h:
            y = np.pad(y, ((0, target_h - h), (0, 0)), mode="constant")
        elif h > target_h:
            y = y[:target_h, :]

        if w < target_w:
            y = np.pad(y, ((0, 0), (0, target_w - w)), mode="constant")
        elif w > target_w:
            y = y[:, :target_w]

        return y

    def _smoothed_emotion(self, fallback: str) -> str:
        if not self.memory:
            return fallback
        vote = Counter(self.memory).most_common(1)[0][0]
        return vote

    def _pre_emphasis(self, y: np.ndarray) -> np.ndarray:
        return lfilter([1, -self.cfg.pre_emphasis], [1], y).astype(np.float32)

    def _rms_normalize(self, y: np.ndarray, target_dbfs: float = -20.0) -> np.ndarray:
        rms = np.sqrt(np.mean(np.square(y)) + 1e-9)
        current_db = 20 * np.log10(rms + 1e-9)
        gain_db = target_dbfs - current_db
        gain = 10 ** (gain_db / 20)
        out = y * gain
        peak = np.max(np.abs(out)) + 1e-9
        if peak > 1.0:
            out = out / peak
        return out.astype(np.float32)

    def _remove_silence(self, y: np.ndarray, db_threshold: float, min_speech_ms: int) -> np.ndarray:
        frame_len = int(0.025 * self.cfg.sample_rate)
        hop_len = int(0.010 * self.cfg.sample_rate)

        if len(y) < frame_len:
            return np.array([], dtype=np.float32)

        frames = librosa.util.frame(y, frame_length=frame_len, hop_length=hop_len)
        rms = np.sqrt(np.mean(frames**2, axis=0) + 1e-9)
        db = 20 * np.log10(rms + 1e-9)
        voiced = db > db_threshold

        min_frames = max(1, int((min_speech_ms / 1000.0) / 0.010))
        cleaned_mask = np.zeros_like(voiced, dtype=bool)

        start = None
        for i, is_voiced in enumerate(voiced):
            if is_voiced and start is None:
                start = i
            if not is_voiced and start is not None:
                if i - start >= min_frames:
                    cleaned_mask[start:i] = True
                start = None
        if start is not None and len(voiced) - start >= min_frames:
            cleaned_mask[start:len(voiced)] = True

        if not np.any(cleaned_mask):
            return np.array([], dtype=np.float32)

        out = np.zeros_like(y)
        for i, keep in enumerate(cleaned_mask):
            if keep:
                s = i * hop_len
                e = min(len(y), s + frame_len)
                out[s:e] = y[s:e]

        nz = np.flatnonzero(np.abs(out) > 1e-6)
        if nz.size == 0:
            return np.array([], dtype=np.float32)

        return out[nz[0] : nz[-1] + 1].astype(np.float32)

    def _spectral_gating(self, y: np.ndarray) -> np.ndarray:
        n_fft = 512
        hop = 128

        stft = librosa.stft(y, n_fft=n_fft, hop_length=hop, win_length=n_fft)
        mag = np.abs(stft)
        phase = np.exp(1j * np.angle(stft))

        frame_energy = np.mean(mag, axis=0)
        noise_frames = frame_energy <= np.percentile(frame_energy, 20)

        if np.any(noise_frames):
            noise_profile = np.mean(mag[:, noise_frames], axis=1, keepdims=True)
        else:
            noise_profile = np.median(mag, axis=1, keepdims=True)

        reduction_strength = 1.5
        floor = 0.02
        mask = 1.0 - (reduction_strength * noise_profile / (mag + 1e-9))
        mask = np.clip(mask, floor, 1.0)

        denoised_mag = mag * mask
        denoised = librosa.istft(denoised_mag * phase, hop_length=hop, win_length=n_fft, length=len(y))
        return denoised.astype(np.float32)


if __name__ == "__main__":
    LABELS = ["neutral", "calm", "happy", "sad", "angry", "fearful", "disgust", "surprised"]
    MODEL_PATH = "./models/ser_model.keras"
    AUDIO_PATH = "./sample.wav"

    pipeline = RobustSERPipeline(model_path=MODEL_PATH, labels=LABELS)
    waveform = pipeline.load_audio(AUDIO_PATH)
    timeline = pipeline.sliding_window_predict(waveform)

    for step in timeline:
        print(step)
