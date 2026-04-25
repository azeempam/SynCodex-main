import argparse
import json
import os
import warnings

import numpy as np

warnings.filterwarnings("ignore")

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


def resize_spectrogram(spec, target_shape=(128, 128)):
    _, width = spec.shape
    _, target_width = target_shape
    if width < target_width:
        pad_width = target_width - width
        spec = np.pad(spec, ((0, 0), (0, pad_width)), mode="constant", constant_values=-80)
    elif width > target_width:
        spec = spec[:, :target_width]
    return spec


def load_feature_matrix(input_path):
    import librosa

    y, sr = librosa.load(input_path, sr=16000)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, hop_length=512)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_fixed = resize_spectrogram(mel_db, target_shape=(128, 128))
    mel_norm = (mel_fixed + 80.0) / 80.0
    return mel_norm.astype(np.float32), y, sr


def heuristic_inference(y, sr):
    if y.size == 0:
        return {
            "emotion": "neutral",
            "confidence": 0.2,
            "scores": {label: 1 / len(EMOTION_LABELS) for label in EMOTION_LABELS},
            "source": "heuristic-fallback",
        }

    abs_signal = np.abs(y)
    energy = float(np.mean(abs_signal))
    zcr = float(np.mean(np.abs(np.diff(np.sign(y)))) / 2.0)

    if energy > 0.09 and zcr > 0.11:
        emotion, confidence = "angry", 0.58
    elif energy > 0.08:
        emotion, confidence = "happy", 0.5
    elif energy < 0.02:
        emotion, confidence = "sad", 0.52
    else:
        emotion, confidence = "neutral", 0.48

    base = {label: 0.05 for label in EMOTION_LABELS}
    base[emotion] = confidence
    norm = sum(base.values())
    scores = {k: float(v / norm) for k, v in base.items()}

    return {
        "emotion": emotion,
        "confidence": float(scores[emotion]),
        "scores": scores,
        "source": "heuristic-fallback",
    }


def torch_inference(mel_norm, model_path):
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    class EmotionCNN(nn.Module):
        def __init__(self, num_classes=8):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 16, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm2d(16)
            self.pool1 = nn.MaxPool2d(2)
            self.conv2 = nn.Conv2d(16, 32, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm2d(32)
            self.pool2 = nn.MaxPool2d(2)
            self.conv3 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
            self.bn3 = nn.BatchNorm2d(64)
            self.pool3 = nn.MaxPool2d(2)
            self.dropout = nn.Dropout(0.6)
            self.fc1 = nn.Linear(64 * 16 * 16, 128)
            self.fc2 = nn.Linear(128, num_classes)

        def forward(self, x):
            x = self.pool1(F.relu(self.bn1(self.conv1(x))))
            x = self.pool2(F.relu(self.bn2(self.conv2(x))))
            x = self.pool3(F.relu(self.bn3(self.conv3(x))))
            x = self.dropout(x)
            x = x.view(x.size(0), -1)
            x = F.relu(self.fc1(x))
            return self.fc2(x)

    device = torch.device("cpu")
    model = EmotionCNN().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    with torch.no_grad():
        x = torch.from_numpy(mel_norm).unsqueeze(0).unsqueeze(0).to(device)
        logits = model(x)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()

    best_idx = int(np.argmax(probs))
    scores = {EMOTION_LABELS[i]: float(probs[i]) for i in range(len(EMOTION_LABELS))}

    return {
        "emotion": EMOTION_LABELS[best_idx],
        "confidence": float(probs[best_idx]),
        "scores": scores,
        "source": "pytorch-local",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to an audio file")
    parser.add_argument("--model", required=False, default="", help="Path to emotion model .pt")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(json.dumps({"error": "Input file not found"}))
        raise SystemExit(1)

    mel_norm, y, sr = load_feature_matrix(args.input)

    result = None
    if args.model and os.path.exists(args.model):
        try:
            result = torch_inference(mel_norm, args.model)
        except Exception:
            result = None

    if result is None:
        result = heuristic_inference(y, sr)

    print(json.dumps(result))


if __name__ == "__main__":
    main()
