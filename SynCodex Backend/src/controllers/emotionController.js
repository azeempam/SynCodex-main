import { inferEmotionFromBase64 } from "../services/emotionInferenceBridge.js";

export async function inferEmotion(req, res) {
  try {
    const { audioBase64, mimeType, sessionId } = req.body || {};

    if (!audioBase64) {
      return res.status(400).json({
        message: "audioBase64 is required",
      });
    }

    const result = await inferEmotionFromBase64({
      audioBase64,
      mimeType,
      sessionId,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Emotion inference failed",
      error: error.message,
    });
  }
}
