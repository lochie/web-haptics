import { useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import type { HapticInput, TriggerOptions } from "web-haptics";
import { useApp } from "../context/app";
import { shakeFavicon } from "../utils/faviconShake";

// abstraction so we can do some extra stuff
export const useHaptics = () => {
  const { debug } = useApp();
  const { trigger } = useWebHaptics({ debug: true, showSwitch: true });

  const triggerWithShake = useCallback(
    (input?: HapticInput, options?: TriggerOptions) => {
      shakeFavicon();
      return trigger(input, options);
    },
    [trigger],
  );

  return {
    trigger: triggerWithShake,
  };
};
