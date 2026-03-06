import { useWebHaptics } from "web-haptics/react";

export type HapticType = "selection" | "success" | "error";

type HapticPatternStep = {
  duration: number;
  delay?: number;
  intensity?: number;
};

type HapticPatternConfig = {
  pattern: HapticPatternStep[];
  options?: {
    intensity: number;
  };
};

const HAPTIC_PATTERNS: Record<HapticType, HapticPatternConfig> = {
  selection: {
    pattern: [{ duration: 8 }],
    options: { intensity: 0.3 },
  },
  success: {
    pattern: [
      { duration: 30 },
      { delay: 60, duration: 40, intensity: 1 },
    ],
  },
  error: {
    pattern: [
      { duration: 40 },
      { delay: 40, duration: 40 },
      { delay: 40, duration: 40 },
    ],
    options: { intensity: 0.9 },
  },
};

export function useHaptic() {
  const { trigger } = useWebHaptics();

  const fire = (type: HapticType) => {
    const { pattern, options } = HAPTIC_PATTERNS[type];
    trigger(pattern, options);
  };

  return {
    selection: () => fire("selection"),
    success: () => fire("success"),
    error: () => fire("error"),
  };
}

export { HAPTIC_PATTERNS };

