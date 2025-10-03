// Retry utility functions for handling transient errors with exponential backoff

// Retry configuration constants
export const MAX_RETRIES = 6;
export const INITIAL_DELAY = 500; // 0.5 seconds
export const BACKOFF_MULTIPLIER = 2;

/**
 * Helper function to wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (network errors, timeouts, rate limits, server errors)
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
export const isRetryableError = (error) => {
  if (error.code === 'NETWORK_ERROR' || 
      error.code === 'TIMEOUT' || 
      error.status === 429 || 
      error.status === 500 || 
      error.status === 502 || 
      error.status === 503 || 
      error.status === 504) {
    return true;
  }
  
  const errorMessage = error.message?.toLowerCase() || '';
  return errorMessage.includes('network') || 
         errorMessage.includes('timeout') || 
         errorMessage.includes('rate limit') ||
         errorMessage.includes('temporarily unavailable') ||
         errorMessage.includes('service unavailable') ||
         errorMessage.includes('fetch');
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.initialDelay - Initial delay in milliseconds
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff
 * @returns {Promise<*>} The result of the operation
 * @throws {Error} If all retry attempts fail
 */
export const withRetry = async (operation, options = {}) => {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_DELAY,
    backoffMultiplier = BACKOFF_MULTIPLIER,
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1 && isRetryableError(error)) {
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 2}/${maxRetries})`);
        await sleep(delay);
      } else {
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

  throw lastError;
};
