import { useWebHaptics } from "web-haptics/react";
import { defaultPatterns } from "web-haptics";

export type HapticType = "selection" | "success" | "error";

export function useHaptic() {
  const { trigger } = useWebHaptics();

  return {
    selection: () => trigger(defaultPatterns.selection),
    success: () => trigger(defaultPatterns.success),
    error: () => trigger(defaultPatterns.error),
  };
}

