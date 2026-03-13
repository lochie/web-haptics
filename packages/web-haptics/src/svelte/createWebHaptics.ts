import { WebHaptics } from "../lib/web-haptics";
import type {
  HapticInput,
  TriggerOptions,
  WebHapticsOptions,
} from "../lib/web-haptics/types";

export function createWebHaptics(options?: WebHapticsOptions) {
  const instance = new WebHaptics(options);

  const trigger = (input?: HapticInput, options?: TriggerOptions) =>
    instance.trigger(input, options);
  const cancel = () => instance.cancel();
  const destroy = () => instance.destroy();
  const setDebug = (debug: boolean) => instance.setDebug(debug);
  const isSupported = WebHaptics.isSupported;
  const supportsVibrationApi = WebHaptics.supportsVibrationApi;

  return {
    trigger,
    cancel,
    destroy,
    setDebug,
    isSupported,
    supportsVibrationApi,
  };
}
