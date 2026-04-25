import { create } from "zustand";

const STRESSED_EMOTIONS = new Set(["angry", "fearful", "sad"]);
const REMINDER_COOLDOWN_MS = 10 * 60 * 1000;

export const useHealthStore = create((set, get) => ({
  currentEmotion: "unknown",
  confidence: 0,
  moodBucket: "neutral",
  lastUpdated: null,
  history: [],
  lastBreakReminderAt: null,

  pushEmotion: ({ emotion, confidence = 0, source = "unknown", ts = new Date().toISOString() }) => {
    const moodBucket = STRESSED_EMOTIONS.has(emotion) ? "stressed" : "neutral";

    set((state) => ({
      currentEmotion: emotion,
      confidence,
      moodBucket,
      lastUpdated: ts,
      history: [{ emotion, confidence, moodBucket, source, ts }, ...state.history].slice(0, 50),
    }));
  },

  canTriggerBreakReminder: () => {
    const state = get();
    if (state.moodBucket !== "stressed" || state.confidence < 0.45) {
      return false;
    }

    if (!state.lastBreakReminderAt) {
      return true;
    }

    return Date.now() - state.lastBreakReminderAt > REMINDER_COOLDOWN_MS;
  },

  markBreakReminder: () => {
    set({ lastBreakReminderAt: Date.now() });
  },
}));
