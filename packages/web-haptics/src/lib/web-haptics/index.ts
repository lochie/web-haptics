import { defaultPatterns } from "./patterns";
import type {
  HapticInput,
  TriggerOptions,
  Vibration,
  WebHapticsOptions,
} from "./types";

const TOGGLE_MIN = 16; // ms at intensity 1 (every frame)
const TOGGLE_MAX = 184; // range above min (0.5 intensity ≈ 100ms)
const MAX_PHASE_MS = 1000; // browser haptic window limit
const PWM_CYCLE = 20; // ms per intensity modulation cycle

/** Convert any HapticInput into a Vibration array. */
function normalizeInput(input: HapticInput): {
  vibrations: Vibration[];
} | null {
  if (typeof input === "number") {
    return { vibrations: [{ duration: input }] };
  }

  if (typeof input === "string") {
    const preset = defaultPatterns[input as keyof typeof defaultPatterns];
    if (!preset) {
      console.warn(`[web-haptics] Unknown preset: "${input}"`);
      return null;
    }
    return { vibrations: preset.pattern.map((v) => ({ ...v })) };
  }

  if (Array.isArray(input)) {
    if (input.length === 0) return { vibrations: [] };

    // number[] shorthand — alternating on/off
    if (typeof input[0] === "number") {
      const nums = input as number[];
      const vibrations: Vibration[] = [];
      for (let i = 0; i < nums.length; i += 2) {
        const delay = i > 0 ? nums[i - 1]! : 0;
        vibrations.push({
          ...(delay > 0 && { delay }),
          duration: nums[i]!,
        });
      }
      return { vibrations };
    }

    // Vibration[]
    return { vibrations: (input as Vibration[]).map((v) => ({ ...v })) };
  }

  // HapticPreset
  return { vibrations: input.pattern.map((v) => ({ ...v })) };
}

/**
 * Apply PWM modulation to a single vibration duration at a given intensity.
 * Returns the flat on/off segments for this vibration.
 */
function modulateVibration(duration: number, intensity: number): number[] {
  if (intensity >= 1) return [duration];
  if (intensity <= 0) return [];

  const onTime = Math.max(1, Math.round(PWM_CYCLE * intensity));
  const offTime = PWM_CYCLE - onTime;
  const result: number[] = [];

  let remaining = duration;
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

  return result;
}

/**
 * Convert Vibration[] to the flat number[] pattern for navigator.vibrate(),
 * applying per-vibration PWM intensity modulation.
 */
function toVibratePattern(
  vibrations: Vibration[],
  defaultIntensity: number,
): number[] {
  const result: number[] = [];

  for (let i = 0; i < vibrations.length; i++) {
    const vib = vibrations[i]!;
    const intensity = Math.max(
      0,
      Math.min(1, vib.intensity ?? defaultIntensity),
    );
    const delay = vib.delay ?? 0;

    // Prepend delay: merge into trailing off-time or add new gap
    if (delay > 0) {
      if (result.length > 0 && result.length % 2 === 0) {
        result[result.length - 1]! += delay;
      } else {
        if (result.length === 0) result.push(0);
        result.push(delay);
      }
    }

    const modulated = modulateVibration(vib.duration, intensity);

    if (modulated.length === 0) {
      // Zero intensity — treat vibration as silence
      if (result.length > 0 && result.length % 2 === 0) {
        result[result.length - 1]! += vib.duration;
      } else if (vib.duration > 0) {
        result.push(0);
        result.push(vib.duration);
      }
      continue;
    }

    // Append modulated vibration segments
    for (const seg of modulated) {
      result.push(seg);
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
  private audioBuffer: AudioBuffer | null = null;

  constructor(options?: WebHapticsOptions) {
    this.instanceId = ++instanceCounter;
    this.debug = options?.debug ?? false;
    this.showSwitch = options?.showSwitch ?? false;
  }

  static readonly isSupported: boolean =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  async trigger(
    input: HapticInput = [{ duration: 25, intensity: 0.7 }],
    options?: TriggerOptions,
  ): Promise<void> {
    const normalized = normalizeInput(input);
    if (!normalized) return;

    const { vibrations } = normalized;
    if (vibrations.length === 0) return;

    const defaultIntensity = Math.max(
      0,
      Math.min(1, options?.intensity ?? 0.5),
    );

    // Validate and clamp durations
    for (const vib of vibrations) {
      if (vib.duration > MAX_PHASE_MS) vib.duration = MAX_PHASE_MS;
      if (
        !Number.isFinite(vib.duration) ||
        vib.duration < 0 ||
        (vib.delay !== undefined &&
          (!Number.isFinite(vib.delay) || vib.delay < 0))
      ) {
        console.warn(
          `[web-haptics] Invalid vibration values. Durations and delays must be finite non-negative numbers.`,
        );
        return;
      }
    }

    if (WebHaptics.isSupported) {
      navigator.vibrate(toVibratePattern(vibrations, defaultIntensity));
    }

    if (!WebHaptics.isSupported || this.debug) {
      this.ensureDOM();
      if (!this.hapticLabel) return;

      if (this.debug) {
        await this.ensureAudio();
      }

      this.stopPattern();

      const firstDelay = vibrations[0]?.delay ?? 0;
      const firstClickFired = firstDelay === 0;

      // Fire first click synchronously to stay within user gesture context
      // (only when the first vibration has no delay)
      if (firstClickFired) {
        this.hapticLabel.click();
        if (this.debug && this.audioCtx) {
          const firstIntensity = Math.max(
            0,
            Math.min(1, vibrations[0]!.intensity ?? defaultIntensity),
          );
          this.playClick(firstIntensity);
        }
      }

      await this.runPattern(vibrations, defaultIntensity, firstClickFired);
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
      this.audioBuffer = null;
    }
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
    if (!debug && this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
      this.audioFilter = null;
      this.audioGain = null;
      this.audioBuffer = null;
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

  private runPattern(
    vibrations: Vibration[],
    defaultIntensity: number,
    firstClickFired: boolean,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.patternResolve = resolve;

      // Build phase boundaries: each vibration has an optional delay then an "on" phase
      const phases: { end: number; isOn: boolean; intensity: number }[] = [];
      let cumulative = 0;
      for (const vib of vibrations) {
        const intensity = Math.max(
          0,
          Math.min(1, vib.intensity ?? defaultIntensity),
        );
        const delay = vib.delay ?? 0;
        if (delay > 0) {
          cumulative += delay;
          phases.push({ end: cumulative, isOn: false, intensity: 0 });
        }
        cumulative += vib.duration;
        phases.push({ end: cumulative, isOn: true, intensity });
      }
      const totalDuration = cumulative;

      let startTime = 0;
      let lastToggleTime = -1;

      const loop = (time: number) => {
        if (startTime === 0) startTime = time;
        const elapsed = time - startTime;

        if (elapsed >= totalDuration) {
          this.rafId = null;
          this.patternResolve = null;
          resolve();
          return;
        }

        // Find current phase
        let phase = phases[0]!;
        for (const p of phases) {
          if (elapsed < p.end) {
            phase = p;
            break;
          }
        }

        if (phase.isOn) {
          const toggleInterval =
            TOGGLE_MIN + (1 - phase.intensity) * TOGGLE_MAX;

          if (lastToggleTime === -1) {
            lastToggleTime = time;
            if (!firstClickFired) {
              this.hapticLabel?.click();
              if (this.debug && this.audioCtx) {
                this.playClick(phase.intensity);
              }
              firstClickFired = true;
            }
          } else if (time - lastToggleTime >= toggleInterval) {
            this.hapticLabel?.click();
            if (this.debug && this.audioCtx) {
              this.playClick(phase.intensity);
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
    if (
      !this.audioCtx ||
      !this.audioFilter ||
      !this.audioGain ||
      !this.audioBuffer
    )
      return;

    const data = this.audioBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }

    this.audioGain.gain.value = 0.5 * intensity;

    const baseFreq = 2000 + intensity * 2000;
    const jitter = 1 + (Math.random() - 0.5) * 0.3;
    this.audioFilter.frequency.value = baseFreq * jitter;

    const source = this.audioCtx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.audioFilter);
    source.onended = () => source.disconnect();
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

      const duration = 0.004;
      this.audioBuffer = this.audioCtx.createBuffer(
        1,
        this.audioCtx.sampleRate * duration,
        this.audioCtx.sampleRate,
      );
      const data = this.audioBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
      }
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
