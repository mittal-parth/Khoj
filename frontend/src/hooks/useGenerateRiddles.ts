import { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { GEMENI_MODEL } from "@/constants";
import { Riddle } from "@/types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_PUBLIC_GEMINI_API_KEY });

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_DELAY = 500; // 1 second
const BACKOFF_MULTIPLIER = 2;

// Helper function to wait for a specified time
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is retryable
const isRetryableError = (error: any): boolean => {
  // Network errors, timeout errors, rate limiting, server errors
  if (error.code === 'NETWORK_ERROR' || 
      error.code === 'TIMEOUT' || 
      error.status === 429 || 
      error.status === 500 || 
      error.status === 502 || 
      error.status === 503 || 
      error.status === 504) {
    return true;
  }
  
  // Check error message for common retryable issues
  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('network') || 
         errorMessage.includes('timeout') || 
         errorMessage.includes('rate limit') ||
         errorMessage.includes('temporarily unavailable') ||
         errorMessage.includes('service unavailable');
};

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

    const attemptGeneration = async (attempt: number): Promise<void> => {
      try {
        // 1. Fetch hunt data from your backend
        // const response = await fetch(`/api/hunts/${huntId}/data`);
        // if (!response.ok) {
        //   throw new Error("Failed to fetch hunt data");
        // }
        // const huntData = await response.json();

        //   localStorage.clear();
        const huntData = {
          locations: clues.decryptedData.map(
            (location: any) => location.description
          ),
          themes: [theme],
        };

        // 2. Generate riddles using Claude
        // const anthropic = new Anthropic({
        //   apiKey: import.meta.env.VITE_PUBLIC_NEXT_PUBLIC_ANTHROPIC_API_KEY,
        //   dangerouslyAllowBrowser: true,
        // });

        const prompt = `You are a riddle generator creating a JSON array of treasure hunt riddles.
            Rules:
            1. You will create exactly ${huntData.locations.length} riddles.
            2. Each riddle should lead to one of these locations: ${huntData.locations.join(", ")}.
            3. Each riddle must incorporate the following themes: ${theme}.
            4. Do not include the actual location names in the riddle text.
            5. Provide a subtle hint for each riddle that aids the solver but does not directly reveal the answer.
            6. Output only valid JSON in this exact structure (no extra text, no explanations):`;

        const aiResponse = await ai.models.generateContent({
          model: GEMENI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  riddle: {
                    type: Type.STRING,
                  },
                  hint: {
                    type: Type.STRING,
                  },
                },
                propertyOrdering: ["riddle", "hint"],
              },
            },
          },
        });

        // const aiResponse = await anthropic.messages.create({
        //   model: "claude-3-haiku-20240307",
        //   max_tokens: 1000,
        //   messages: [{ role: "user", content: prompt }],
        // });

        // Add type assertion or check to handle the content type
        if (aiResponse.text) {
          const content = aiResponse.text;
          
          // Validate JSON before parsing
          let parsedRiddles;
          try {
            parsedRiddles = JSON.parse(content);
          } catch (jsonError) {
            throw new Error(`Invalid JSON response from AI: ${jsonError}`);
          }

          // Validate the structure of parsed riddles
          if (!Array.isArray(parsedRiddles)) {
            throw new Error("AI response is not an array");
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
          setRetryCount(0);
          setIsRetrying(false);
        } else {
          throw new Error("Unexpected response format from AI - no text content");
        }
      } catch (err) {
        console.error(`Riddle Generation Error (attempt ${attempt + 1}):`, err);
        
        // Check if we should retry
        if (attempt < MAX_RETRIES - 1 && isRetryableError(err)) {
          setIsRetrying(true);
          setRetryCount(attempt + 1);
          
          // Calculate delay with exponential backoff
          const delay = INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt);
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${MAX_RETRIES})`);
          
          await sleep(delay);
          return attemptGeneration(attempt + 1);
        } else {
          // Max retries reached or non-retryable error
          const finalError = err instanceof Error ? err : new Error("Unknown error");
          if (attempt >= MAX_RETRIES - 1) {
            finalError.message = `Failed after ${MAX_RETRIES} attempts: ${finalError.message}`;
          }
          setError(finalError);
          setIsRetrying(false);
          throw finalError;
        }
      }
    };

    try {
      await attemptGeneration(0);
    } catch (err) {
      // Error already set in attemptGeneration
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
