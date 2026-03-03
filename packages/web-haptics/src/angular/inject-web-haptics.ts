import { inject, DestroyRef, afterNextRender } from "@angular/core";
import { WebHaptics } from "../lib/web-haptics";
import type {
  HapticInput,
  TriggerOptions,
  WebHapticsOptions,
} from "../lib/web-haptics/types";

export function injectWebHaptics(options?: WebHapticsOptions) {
  const destroyRef = inject(DestroyRef);
  let instance: WebHaptics | null = null;

  afterNextRender(() => {
    instance = new WebHaptics(options);
  });

  destroyRef.onDestroy(() => {
    instance?.destroy();
    instance = null;
  });

  const trigger = (input?: HapticInput, options?: TriggerOptions) =>
    instance?.trigger(input, options);
  const cancel = () => instance?.cancel();
  const isSupported = WebHaptics.isSupported;

  return { trigger, cancel, isSupported };
}
