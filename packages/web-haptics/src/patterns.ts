import type { HapticPreset } from "./types";

export const defaultPatterns = {
  // --- Notification (UINotificationFeedbackGenerator) ---
  success: {
    // ascending double-tap indicating success.
    pattern: [
      { duration: 30, intensity: 0.5 },
      { delay: 60, duration: 40, intensity: 1 },
    ],
  },
  warning: {
    // two taps with hesitation indicating a warning.
    pattern: [
      { duration: 40, intensity: 0.8 },
      { delay: 100, duration: 40, intensity: 0.6 },
    ],
  },
  error: {
    // three rapid harsh taps indicating an error.
    pattern: [
      { duration: 40, intensity: 0.9 },
      { delay: 40, duration: 40, intensity: 0.9 },
      { delay: 40, duration: 40, intensity: 0.9 },
    ],
  },

  // --- Impact (UIImpactFeedbackGenerator) ---
  light: {
    // single light tap indicating a minor impact.
    pattern: [{ duration: 15, intensity: 0.4 }],
  },
  medium: {
    // moderate tap for standard interactions.
    pattern: [{ duration: 25, intensity: 0.7 }],
  },
  heavy: {
    // strong tap for significant interactions.
    pattern: [{ duration: 35, intensity: 1 }],
  },
  soft: {
    // soft, cushioned tap with a rounded feel.
    pattern: [{ duration: 40, intensity: 0.5 }],
  },
  rigid: {
    // hard, crisp tap with a precise feel.
    pattern: [{ duration: 10, intensity: 1 }],
  },

  // --- Selection (UISelectionFeedbackGenerator) ---
  selection: {
    // subtle tap for selection changes.
    pattern: [{ duration: 8, intensity: 0.3 }],
  },

  // --- Custom ---
  nudge: {
    // two quick taps with a pause, indicating a nudge or reminder.
    pattern: [
      { duration: 80, intensity: 0.8 },
      { delay: 80, duration: 50, intensity: 0.3 },
    ],
  },
  buzz: {
    // rapid, low-intensity taps creating a buzzing effect.
    pattern: [{ duration: 1000, intensity: 1 }],
  },
} as const satisfies Record<string, HapticPreset>;
