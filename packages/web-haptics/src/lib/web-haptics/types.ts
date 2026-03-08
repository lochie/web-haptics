export interface Vibration {
  duration: number;
  intensity?: number;
  delay?: number;
}

export type HapticPattern = number[] | Vibration[];

export interface HapticPreset {
  pattern: Vibration[];
}

export type HapticInput = number | string | HapticPattern | HapticPreset;

export interface TriggerOptions {
  intensity?: number;
  /** When `true`, the haptic pattern repeats continuously until `cancel()` is called. */
  repeat?: boolean;
}

export interface WebHapticsOptions {
  debug?: boolean;
  showSwitch?: boolean;
}
