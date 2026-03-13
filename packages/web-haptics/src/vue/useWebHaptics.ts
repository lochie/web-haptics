import { onMounted, onUnmounted, watch } from "vue";
import { WebHaptics } from "../lib/web-haptics";
import type {
  HapticInput,
  TriggerOptions,
  WebHapticsOptions,
} from "../lib/web-haptics/types";

export function useWebHaptics(options?: WebHapticsOptions) {
  let instance: WebHaptics | null = null;

  onMounted(() => {
    instance = new WebHaptics(options);
  });

  onUnmounted(() => {
    instance?.destroy();
    instance = null;
  });

  watch(
    () => options?.debug,
    (val) => {
      instance?.setDebug(val ?? false);
    },
  );

  const trigger = (input?: HapticInput, options?: TriggerOptions) =>
    instance?.trigger(input, options);
  const cancel = () => instance?.cancel();
  const isSupported = WebHaptics.isSupported;
  const supportsVibrationApi = WebHaptics.supportsVibrationApi;

  return { trigger, cancel, isSupported, supportsVibrationApi };
}
