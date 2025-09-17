// Retry configuration
export const MAX_RETRIES = 5;
export const INITIAL_DELAY = 500; // 0.5 seconds
export const BACKOFF_MULTIPLIER = 2;

// Helper function to wait for a specified time
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error is retryable
export const isRetryableError = (error: any): boolean => {
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
         errorMessage.includes('service unavailable') ||
         errorMessage.includes('fetch');
};

// Generic retry function with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_DELAY,
    backoffMultiplier = BACKOFF_MULTIPLIER,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < maxRetries - 1 && isRetryableError(error)) {
        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        
        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
        await sleep(delay);
      } else {
        // Max retries reached or non-retryable error
        if (attempt >= maxRetries - 1) {
          const finalError = error instanceof Error ? error : new Error("Unknown error");
          finalError.message = `Failed after ${maxRetries} attempts: ${finalError.message}`;
          throw finalError;
        } else {
          throw error;
        }
      }
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError;
}
