import { onMount, onCleanup, createEffect, on } from "solid-js";
import { WebHaptics } from "../lib/web-haptics";
import type {
  HapticInput,
  TriggerOptions,
  WebHapticsOptions,
} from "../lib/web-haptics/types";

export function useWebHaptics(options?: () => WebHapticsOptions) {
  let instance: WebHaptics | null = null;

  onMount(() => {
    instance = new WebHaptics(options?.());
  });

  onCleanup(() => {
    instance?.destroy();
    instance = null;
  });

  createEffect(
    on(
      () => options?.()?.debug,
      (debug) => {
        instance?.setDebug(debug ?? false);
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      () => options?.()?.showSwitch,
      (showSwitch) => {
        instance?.setShowSwitch(showSwitch ?? false);
      },
      { defer: true },
    ),
  );

  const trigger = (input?: HapticInput, opts?: TriggerOptions) =>
    instance?.trigger(input, opts);

  const cancel = () => instance?.cancel();

  const isSupported = WebHaptics.isSupported;

  return { trigger, cancel, isSupported };
}
