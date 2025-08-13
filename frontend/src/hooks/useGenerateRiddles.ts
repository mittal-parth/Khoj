import { useState } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { GEMENI_MODEL } from "@/constants";

export interface Riddle {
  riddle: string;
  answer: string;
  hint: string;
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_PUBLIC_GEMINI_API_KEY });

export function useGenerateRiddles(huntId: any) {
  const [riddles, setRiddles] = useState<Riddle[] | null>(() => {
    // Initialize from localStorage if available
    const stored = localStorage.getItem(`hunt_riddles_${huntId}`);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRiddles = async (clues: any, huntId: string) => {
    setIsLoading(true);
    setError(null);

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
        themes: ["Tech", "web3", "easy"],
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
          3. Each riddle must incorporate the following themes: ${huntData.themes.join(", ")}.
          4. Do not include the actual location names in the riddle text.
          5. Provide a subtle hint for each riddle that aids the solver but does not directly reveal the answer.
          6. Output only valid JSON in this exact structure (no extra text, no explanations):`;

      const aiResponse = await ai.models.generateContent({
        model: GEMENI_MODEL,
        contents:
          prompt,
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
        const parsedRiddles = JSON.parse(content);

        // Store riddles with hunt ID
        const storageKey = `hunt_riddles_${huntId}`;
        localStorage.setItem(storageKey, JSON.stringify(parsedRiddles));
        setRiddles(parsedRiddles);
      } else {
        throw new Error("Unexpected response format from Claude");
      }
    } catch (err) {
      console.error("Riddle Generation Error:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchRiddles,
    riddles,
    isLoading,
    error,
  };
}
