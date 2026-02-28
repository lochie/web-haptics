"use client";

import { useRef, useEffect, useCallback } from "react";
import { WebHaptics } from "../lib/web-haptics";
import type {
  HapticInput,
  TriggerOptions,
  WebHapticsOptions,
} from "../lib/web-haptics/types";

export function useWebHaptics(options?: WebHapticsOptions) {
  const instanceRef = useRef<WebHaptics | null>(null);

  useEffect(() => {
    instanceRef.current = new WebHaptics(options);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    instanceRef.current?.setDebug(options?.debug ?? false);
  }, [options?.debug]);

  useEffect(() => {
    instanceRef.current?.setShowSwitch(options?.showSwitch ?? false);
  }, [options?.showSwitch]);

  const trigger = useCallback(
    (input?: HapticInput, options?: TriggerOptions) =>
      instanceRef.current?.trigger(input, options),
    [],
  );

  const cancel = useCallback(() => instanceRef.current?.cancel(), []);

  const isSupported = WebHaptics.isSupported;

  return { trigger, cancel, isSupported };
}
