import 'ios-vibrator-pro-max'
import { defaultPatterns } from "./patterns";
import type {
  HapticInput,
  TriggerOptions,
  Vibration,
} from "./types";

export { enableMainThreadBlocking } from 'ios-vibrator-pro-max'
export { version } from "../package.json";

export { defaultPatterns } from "./patterns";
export type {
  Vibration,
  HapticPattern,
  HapticPreset,
  HapticInput,
  TriggerOptions,
} from "./types";


const TOGGLE_MIN = 16; // ms at intensity 1 (every frame)
const TOGGLE_MAX = 184; // range above min (0.5 intensity ≈ 100ms)
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


  let rafId: number | null = null;
  let patternResolve: (() => void) | null = null;
  let audioCtx: AudioContext | null = null;
  let audioFilter: BiquadFilterNode | null = null;
  let audioGain: GainNode | null = null;
  let audioBuffer: AudioBuffer | null = null;

  export const isSupported: boolean =
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  export async function trigger(
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

    if (isSupported) {
      navigator.vibrate(toVibratePattern(vibrations, defaultIntensity));
    }

    if (!isSupported || options?.debug) {
      if (options?.debug) {
        await ensureAudio();
      }

      stopPattern();

      const firstDelay = vibrations[0]?.delay ?? 0;
      const firstClickFired = firstDelay === 0;

      // Fire first click synchronously to stay within user gesture context
      // (only when the first vibration has no delay)
      if (firstClickFired) {
        if (options?.debug && audioCtx) {
          const firstIntensity = Math.max(
            0,
            Math.min(1, vibrations[0]!.intensity ?? defaultIntensity),
          );
          playClick(firstIntensity);
        }
      }

      await runPattern(vibrations, defaultIntensity, firstClickFired, options?.debug ?? false);
    }
  }

 export function cancel(): void {
    stopPattern();

    if (isSupported) {
      navigator.vibrate(0);
    }
  }

  export function setDebug(debug: boolean): void {
    debug = debug;
    if (!debug && audioCtx) {
      audioCtx.close();
      audioCtx = null;
      audioFilter = null;
      audioGain = null;
      audioBuffer = null;
    }
  }

  function stopPattern(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    patternResolve?.();
    patternResolve = null;
  }

  function runPattern(
    vibrations: Vibration[],
    defaultIntensity: number,
    firstClickFired: boolean,
    debug: boolean
  ): Promise<void> {
    return new Promise((resolve) => {
      patternResolve = resolve;

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
          rafId = null;
          patternResolve = null;
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
              if (debug && audioCtx) {
                playClick(phase.intensity);
              }
              firstClickFired = true;
            }
          } else if (time - lastToggleTime >= toggleInterval) {
            if (debug && audioCtx) {
              playClick(phase.intensity);
            }
            lastToggleTime = time;
          }
        }

        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });
  }

  function playClick(intensity: number): void {
    if (
      !audioCtx ||
      !audioFilter ||
      !audioGain ||
      !audioBuffer
    )
      return;

    const data = audioBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }

    audioGain.gain.value = 0.5 * intensity;

    const baseFreq = 2000 + intensity * 2000;
    const jitter = 1 + (Math.random() - 0.5) * 0.3;
    audioFilter.frequency.value = baseFreq * jitter;

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioFilter);
    source.onended = () => source.disconnect();
    source.start();
  }

 async function ensureAudio(): Promise<void> {
    if (!audioCtx && typeof AudioContext !== "undefined") {
      audioCtx = new AudioContext();

      audioFilter = audioCtx.createBiquadFilter();
      audioFilter.type = "bandpass";
      audioFilter.frequency.value = 4000;
      audioFilter.Q.value = 8;

      audioGain = audioCtx.createGain();
      audioFilter.connect(audioGain);
      audioGain.connect(audioCtx.destination);

      const duration = 0.004;
      audioBuffer = audioCtx.createBuffer(
        1,
        audioCtx.sampleRate * duration,
        audioCtx.sampleRate,
      );
      const data = audioBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
      }
    }
    if (audioCtx?.state === "suspended") {
      await audioCtx.resume();
    }
  }
