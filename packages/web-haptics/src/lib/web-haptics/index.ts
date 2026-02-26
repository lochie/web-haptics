import { HapticDebugger } from "./debug";
import { defaultPatterns } from "./patterns";
import type { HapticInput, WebHapticsOptions } from "./types";

let instanceCounter = 0;

export class WebHaptics {
  private hapticLabel: HTMLLabelElement | null = null;
  private domInitialized = false;
  private instanceId: number;
  private hapticDebugger: HapticDebugger | null;

  constructor(options?: WebHapticsOptions) {
    this.instanceId = ++instanceCounter;
    this.hapticDebugger = options?.debug ? new HapticDebugger() : null;
  }

  static isSupported(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    );
  }

  async trigger(input: HapticInput = defaultPatterns.lightTap): Promise<void> {
    const pattern = typeof input === "number" ? [input] : input;

    for (let i = 0; i < pattern.length; i++) {
      if (!Number.isFinite(pattern[i]) || pattern[i]! < 0) {
        console.warn(
          `[web-haptics] Invalid value at index ${i}: ${pattern[i]}. Pattern values must be finite non-negative numbers.`,
        );
        return;
      }
    }

    if (this.hapticDebugger) {
      this.hapticDebugger.run(pattern);
    }

    if (WebHaptics.isSupported()) {
      navigator.vibrate(pattern);
    } else {
      this.ensureDOM();
      if (!this.hapticLabel) return;

      const TOGGLE_INTERVAL = 10;

      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) {
          const duration = pattern[i]!;
          const toggleCount = Math.max(
            1,
            Math.floor(duration / TOGGLE_INTERVAL),
          );
          const interval = duration / toggleCount;

          for (let t = 0; t < toggleCount; t++) {
            this.hapticLabel.click();
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, pattern[i]));
        }
      }
    }
  }

  cancel(): void {
    if (WebHaptics.isSupported()) {
      navigator.vibrate(0);
    }
  }

  destroy(): void {
    if (this.hapticLabel) {
      this.hapticLabel.remove();
      this.hapticLabel = null;
      this.domInitialized = false;
    }
    this.hapticDebugger?.destroy();
  }

  private ensureDOM(): void {
    if (this.domInitialized) return;
    if (typeof document === "undefined") return;

    const id = `web-haptics-${this.instanceId}`;

    const hapticLabel = document.createElement("label");
    hapticLabel.setAttribute("for", id);
    hapticLabel.style.display = "none";
    hapticLabel.textContent = "Haptic feedback";
    this.hapticLabel = hapticLabel;

    const hapticCheckbox = document.createElement("input");
    hapticCheckbox.type = "checkbox";
    hapticCheckbox.setAttribute("switch", "");
    hapticCheckbox.id = id;
    hapticCheckbox.style.display = "none";

    hapticLabel.appendChild(hapticCheckbox);
    document.body.appendChild(hapticLabel);

    this.domInitialized = true;
  }
}
