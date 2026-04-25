import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const INFERENCE_SCRIPT = path.join(
  REPO_ROOT,
  "cheating detection",
  "emotion_inference.py"
);

const MIME_TO_EXT = {
  "audio/webm": "webm",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
};

function parseBase64Payload(audioBase64) {
  if (!audioBase64 || typeof audioBase64 !== "string") {
    throw new Error("Invalid audio payload");
  }

  const dataUrlMatch = audioBase64.match(/^data:(.*?);base64,(.*)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64Data: dataUrlMatch[2],
    };
  }

  return {
    mimeType: null,
    base64Data: audioBase64,
  };
}

function runInferenceProcess({ tempFilePath, modelPath }) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_BIN || "python3";
    const args = [INFERENCE_SCRIPT, "--input", tempFilePath];

    if (modelPath) {
      args.push("--model", modelPath);
    }

    const child = spawn(pythonCommand, args, {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: path.dirname(INFERENCE_SCRIPT),
    });

    let stdout = "";
    let stderr = "";

    const timeoutMs = Number(process.env.EMOTION_INFERENCE_TIMEOUT_MS || 12000);
    const timeoutId = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Emotion inference timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      if (code !== 0) {
        reject(new Error(stderr || `Emotion inference exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON returned by emotion inference script"));
      }
    });
  });
}

function buildFallbackResult(reason) {
  return {
    emotion: "neutral",
    confidence: 0.35,
    scores: {
      neutral: 0.35,
      calm: 0.15,
      happy: 0.1,
      sad: 0.1,
      angry: 0.1,
      fearful: 0.05,
      disgust: 0.05,
      surprised: 0.1,
    },
    source: "bridge-fallback",
    degraded: true,
    reason,
  };
}

function sanitizeSessionId(sessionId) {
  if (!sessionId) return "session";
  return String(sessionId).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64) || "session";
}

export async function inferEmotionFromBase64({
  audioBase64,
  mimeType,
  sessionId,
}) {
  const { mimeType: inferredMime, base64Data } = parseBase64Payload(audioBase64);
  const resolvedMimeType = mimeType || inferredMime || "audio/webm";
  const extension = MIME_TO_EXT[resolvedMimeType] || "webm";
  const safeSessionId = sanitizeSessionId(sessionId);
  const tempFilePath = path.join(
    os.tmpdir(),
    `emotion-${safeSessionId}-${Date.now()}.${extension}`
  );

  await fs.writeFile(tempFilePath, Buffer.from(base64Data, "base64"));

  try {
    if (!INFERENCE_SCRIPT) {
      return {
        ...buildFallbackResult("Inference script path not configured"),
        ts: new Date().toISOString(),
      };
    }

    try {
      await fs.access(INFERENCE_SCRIPT);
    } catch {
      return {
        ...buildFallbackResult(`Inference script not found at ${INFERENCE_SCRIPT}`),
        ts: new Date().toISOString(),
      };
    }

    const modelPath = process.env.EMOTION_MODEL_PATH || "";
    let result;

    try {
      result = await runInferenceProcess({ tempFilePath, modelPath });
    } catch (error) {
      result = buildFallbackResult(error.message || "Python inference execution failed");
    }

    return {
      emotion: result.emotion || "neutral",
      confidence: Number(result.confidence || 0),
      scores: result.scores || {},
      source: result.source || "unknown",
      degraded: Boolean(result.degraded),
      reason: result.reason || "",
      ts: new Date().toISOString(),
    };
  } finally {
    await fs.unlink(tempFilePath).catch(() => undefined);
  }
}
