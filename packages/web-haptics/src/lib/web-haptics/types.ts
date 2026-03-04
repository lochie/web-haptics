import type { defaultPatterns } from "./patterns";

export interface Vibration {
  duration: number;
  intensity?: number;
  delay?: number;
}

export type HapticPattern = number[] | Vibration[];

export interface HapticPreset {
  pattern: Vibration[];
}

export type DefaultPattern = keyof typeof defaultPatterns;

export type HapticInput =
  | number
  | DefaultPattern
  | (string & {})
  | HapticPattern
  | HapticPreset;

export interface TriggerOptions {
  intensity?: number;
}

export interface WebHapticsOptions {
  debug?: boolean;
  showSwitch?: boolean;
}
