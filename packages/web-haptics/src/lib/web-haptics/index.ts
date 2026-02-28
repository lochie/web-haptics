import { defaultPatterns } from "./patterns";
import type { HapticInput, TriggerOptions, WebHapticsOptions } from "./types";

const TOGGLE_MIN = 16; // ms at intensity 1 (every frame)
const TOGGLE_MAX = 184; // range above min (0.5 intensity ≈ 100ms)
const MAX_PHASE_MS = 1000; // browser haptic window limit
const PWM_CYCLE = 20; // ms per intensity modulation cycle

function modulatePattern(pattern: number[], intensity: number): number[] {
  if (intensity >= 1) return pattern;
  if (intensity <= 0) return [];

  const onTime = Math.max(1, Math.round(PWM_CYCLE * intensity));
  const offTime = PWM_CYCLE - onTime;
  const result: number[] = [];

  for (let i = 0; i < pattern.length; i++) {
    const dur = pattern[i]!;

    if (i % 2 === 0) {
      let remaining = dur;
      while (remaining >= PWM_CYCLE) {
        result.push(onTime);
        result.push(offTime);
        remaining -= PWM_CYCLE;
      }
      if (remaining > 0) {
        const remOn = Math.max(1, Math.round(remaining * intensity));
        result.push(remOn);
        const remOff = remaining - remOn;
        if (remOff > 0) result.push(remOff);
      }
    } else {
      if (result.length > 0 && result.length % 2 === 0) {
        result[result.length - 1]! += dur;
      } else {
        result.push(dur);
      }
    }
  }

  return result;
}

let instanceCounter = 0;

export class WebHaptics {
  private hapticLabel: HTMLLabelElement | null = null;
  private domInitialized = false;
  private instanceId: number;
  private debug: boolean;
  private showSwitch: boolean;
  private rafId: number | null = null;
  private patternResolve: (() => void) | null = null;
  private audioCtx: AudioContext | null = null;
  private audioFilter: BiquadFilterNode | null = null;
  private audioGain: GainNode | null = null;

  constructor(options?: WebHapticsOptions) {
    this.instanceId = ++instanceCounter;
    this.debug = options?.debug ?? false;
    this.showSwitch = options?.showSwitch ?? false;
  }

  static readonly isSupported: boolean =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  async trigger(
    input: HapticInput = [10],
    options?: TriggerOptions,
  ): Promise<void> {
    let pattern: number[];
    let defaultIntensity = 0.5;

    if (typeof input === "number") {
      pattern = [input];
    } else if (typeof input === "string") {
      const preset = defaultPatterns[input as keyof typeof defaultPatterns];
      if (!preset) {
        console.warn(`[web-haptics] Unknown preset: "${input}"`);
        return;
      }
      pattern = [...preset.pattern];
      defaultIntensity = preset.intensity;
    } else if (Array.isArray(input)) {
      pattern = [...input];
    } else {
      pattern = [...input.pattern];
      defaultIntensity = input.intensity;
    }

    const intensity = Math.max(
      0,
      Math.min(1, options?.intensity ?? defaultIntensity),
    );

    for (let i = 0; i < pattern.length; i++) {
      if (i % 2 === 0 && pattern[i]! > MAX_PHASE_MS) {
        pattern[i] = MAX_PHASE_MS;
      }
      if (!Number.isFinite(pattern[i]) || pattern[i]! < 0) {
        console.warn(
          `[web-haptics] Invalid value at index ${i}: ${pattern[i]}. Pattern values must be finite non-negative numbers.`,
        );
        return;
      }
    }

    if (WebHaptics.isSupported) {
      navigator.vibrate(modulatePattern(pattern, intensity));
    }

    if (!WebHaptics.isSupported || this.debug) {
      this.ensureDOM();
      if (!this.hapticLabel) return;

      if (this.debug) {
        await this.ensureAudio();
      }

      this.stopPattern();

      // Fire first click synchronously to stay within user gesture context
      // (iOS blocks haptics from programmatic clicks outside gesture handlers)
      this.hapticLabel.click();
      if (this.debug && this.audioCtx) {
        this.playClick(intensity);
      }

      await this.runPattern(pattern, intensity);
    }
  }

  cancel(): void {
    this.stopPattern();
    if (WebHaptics.isSupported) {
      navigator.vibrate(0);
    }
  }

  destroy(): void {
    this.stopPattern();
    if (this.hapticLabel) {
      this.hapticLabel.remove();
      this.hapticLabel = null;
      this.domInitialized = false;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.audioFilter = null;
      this.audioGain = null;
    }
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
    if (!debug && this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.audioFilter = null;
      this.audioGain = null;
    }
  }

  setShowSwitch(show: boolean): void {
    this.showSwitch = show;
    if (this.hapticLabel) {
      const checkbox = this.hapticLabel.querySelector("input");
      this.hapticLabel.style.display = show ? "" : "none";
      if (checkbox) checkbox.style.display = show ? "" : "none";
    }
  }

  private stopPattern(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.patternResolve?.();
    this.patternResolve = null;
  }

  private runPattern(pattern: number[], intensity: number): Promise<void> {
    return new Promise((resolve) => {
      this.patternResolve = resolve;

      const phases: number[] = [];
      let cumulative = 0;
      for (const p of pattern) {
        cumulative += p;
        phases.push(cumulative);
      }
      const totalDuration = cumulative;

      const toggleInterval = TOGGLE_MIN + (1 - intensity) * TOGGLE_MAX;
      let startTime = 0;
      let lastToggleTime = -1; // -1 signals first click was already fired synchronously

      const loop = (time: number) => {
        if (startTime === 0) startTime = time;
        const elapsed = time - startTime;

        if (elapsed >= totalDuration) {
          this.rafId = null;
          this.patternResolve = null;
          resolve();
          return;
        }

        let phaseIndex = 0;
        for (let i = 0; i < phases.length; i++) {
          if (elapsed < phases[i]!) {
            phaseIndex = i;
            break;
          }
        }

        if (phaseIndex % 2 === 0) {
          if (lastToggleTime === -1) {
            // Skip first toggle — already fired synchronously
            lastToggleTime = time;
          } else if (time - lastToggleTime >= toggleInterval) {
            this.hapticLabel?.click();
            if (this.debug && this.audioCtx) {
              this.playClick(intensity);
            }
            lastToggleTime = time;
          }
        }

        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    });
  }

  private playClick(intensity: number): void {
    if (!this.audioCtx || !this.audioFilter || !this.audioGain) return;

    const duration = 0.004;
    const buffer = this.audioCtx.createBuffer(
      1,
      this.audioCtx.sampleRate * duration,
      this.audioCtx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }

    this.audioGain.gain.value = 0.5 * intensity;

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioFilter);
    source.start();
  }

  private async ensureAudio(): Promise<void> {
    if (!this.audioCtx && typeof AudioContext !== "undefined") {
      this.audioCtx = new AudioContext();

      this.audioFilter = this.audioCtx.createBiquadFilter();
      this.audioFilter.type = "bandpass";
      this.audioFilter.frequency.value = 4000;
      this.audioFilter.Q.value = 8;

      this.audioGain = this.audioCtx.createGain();
      this.audioFilter.connect(this.audioGain);
      this.audioGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx?.state === "suspended") {
      await this.audioCtx.resume();
    }
  }

  private ensureDOM(): void {
    if (this.domInitialized) return;
    if (typeof document === "undefined") return;

    const id = `web-haptics-${this.instanceId}`;

    const hapticLabel = document.createElement("label");
    hapticLabel.setAttribute("for", id);
    hapticLabel.textContent = "Haptic feedback";
    hapticLabel.style.position = "fixed";
    hapticLabel.style.bottom = "10px";
    hapticLabel.style.left = "10px";
    hapticLabel.style.padding = "5px 10px";
    hapticLabel.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    hapticLabel.style.color = "white";
    hapticLabel.style.fontFamily = "sans-serif";
    hapticLabel.style.fontSize = "14px";
    hapticLabel.style.borderRadius = "4px";
    hapticLabel.style.zIndex = "9999";
    hapticLabel.style.userSelect = "none";
    this.hapticLabel = hapticLabel;

    const hapticCheckbox = document.createElement("input");
    hapticCheckbox.type = "checkbox";
    hapticCheckbox.setAttribute("switch", "");
    hapticCheckbox.id = id;
    hapticCheckbox.style.all = "initial";
    hapticCheckbox.style.appearance = "auto";

    if (!this.showSwitch) {
      hapticLabel.style.display = "none";
      hapticCheckbox.style.display = "none";
    }

    hapticLabel.appendChild(hapticCheckbox);
    document.body.appendChild(hapticLabel);
    this.domInitialized = true;
  }
}
