import { useState } from "react";
import { Riddle } from "@/types";
import { withRetry } from "@/utils/retryUtils";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

export function useGenerateRiddles(huntId: any) {
  const [riddles, setRiddles] = useState<Riddle[] | null>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem(`hunt_riddles_${huntId}`);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchRiddles = async (clues: any, huntId: string, theme: string) => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);

    const generateRiddlesOperation = async (): Promise<void> => {
      const locations = clues.decryptedData.map(
        (location: any) => location.description
      );

      // Call backend endpoint to generate riddles
      const response = await fetch(`${BACKEND_URL}/generate-riddles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations,
          theme,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.riddles) {
        throw new Error("Invalid response format from server");
      }

      const parsedRiddles = data.riddles;

      // Validate the structure of parsed riddles
      if (!Array.isArray(parsedRiddles)) {
        throw new Error("Response riddles is not an array");
      }

      // Validate each riddle has required properties
      for (let i = 0; i < parsedRiddles.length; i++) {
        const riddle = parsedRiddles[i];
        if (!riddle.riddle || !riddle.hint || typeof riddle.riddle !== 'string' || typeof riddle.hint !== 'string') {
          throw new Error(`Invalid riddle structure at index ${i}`);
        }
      }

      // Store riddles with hunt ID
      const storageKey = `hunt_riddles_${huntId}`;
      localStorage.setItem(storageKey, JSON.stringify(parsedRiddles));
      setRiddles(parsedRiddles);
    };

    try {
      await withRetry(generateRiddlesOperation, {
        onRetry: (attempt, error) => {
          console.error(`Riddle Generation Error (attempt ${attempt}):`, error);
          setIsRetrying(true);
          setRetryCount(attempt);
        }
      });
      
      // Reset retry state on success
      setRetryCount(0);
      setIsRetrying(false);
    } catch (err) {
      // Set error state
      const finalError = err instanceof Error ? err : new Error("Unknown error");
      setError(finalError);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  return {
    fetchRiddles,
    riddles,
    isLoading,
    error,
    retryCount,
    isRetrying,
  };
}
