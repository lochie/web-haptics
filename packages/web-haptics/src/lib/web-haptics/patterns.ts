import type { HapticPreset } from "./types";

export const defaultPatterns = {
  // --- Notification (UINotificationFeedbackGenerator) ---
  success: {
    pattern: [
      { duration: 30, intensity: 0.5 },
      { delay: 60, duration: 40, intensity: 1 },
    ],
    description: "Ascending double-tap indicating success.",
  },
  warning: {
    pattern: [
      { duration: 40, intensity: 0.8 },
      { delay: 100, duration: 40, intensity: 0.6 },
    ],
    description: "Two taps with hesitation indicating a warning.",
  },
  error: {
    pattern: [
      { duration: 40, intensity: 0.9 },
      { delay: 40, duration: 40, intensity: 0.9 },
      { delay: 40, duration: 40, intensity: 0.9 },
    ],
    description: "Three rapid harsh taps indicating an error.",
  },

  // --- Impact (UIImpactFeedbackGenerator) ---
  light: {
    pattern: [{ duration: 15, intensity: 0.4 }],
    description: "Subtle light tap for minor interactions.",
  },
  medium: {
    pattern: [{ duration: 25, intensity: 0.7 }],
    description: "Moderate tap for standard interactions.",
  },
  heavy: {
    pattern: [{ duration: 35, intensity: 1 }],
    description: "Strong tap for significant interactions.",
  },
  soft: {
    pattern: [{ duration: 40, intensity: 0.5 }],
    description: "Soft, cushioned tap with a rounded feel.",
  },
  rigid: {
    pattern: [{ duration: 10, intensity: 1 }],
    description: "Hard, crisp tap with a precise feel.",
  },

  // --- Selection (UISelectionFeedbackGenerator) ---
  selection: {
    pattern: [{ duration: 8, intensity: 0.3 }],
    description: "Ultra-light tick for selection changes.",
  },

  // --- Custom ---
  nudge: {
    pattern: [
      { duration: 80, intensity: 0.8 },
      { delay: 80, duration: 50, intensity: 0.3 },
    ],
    description: "A series of taps indicating a nudge.",
  },
  buzz: {
    pattern: [{ duration: 1000, intensity: 1 }],
    description: "A long vibration.",
  },
} as const satisfies Record<string, HapticPreset>;
