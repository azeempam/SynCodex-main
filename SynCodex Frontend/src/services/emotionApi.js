import API from "./api";

export async function inferEmotionChunk({ audioBase64, mimeType, sessionId }) {
  const response = await API.post("/api/emotion/infer", {
    audioBase64,
    mimeType,
    sessionId,
  });

  return response.data;
}
