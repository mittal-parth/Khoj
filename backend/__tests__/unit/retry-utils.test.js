import { describe, it, expect, jest } from '@jest/globals';
import { withRetry, isRetryableError, sleep } from '../../retry-utils.js';

describe('Retry Utilities', () => {
  describe('withRetry', () => {
    it('should execute function successfully on first try', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const networkError = new Error('network timeout');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await withRetry(mockFn, { maxRetries: 3, initialDelay: 10 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries for retryable errors', async () => {
      const networkError = new Error('network error');
      const mockFn = jest.fn().mockRejectedValue(networkError);

      await expect(
        withRetry(mockFn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow('Failed after 3 attempts');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Validation error');
      const mockFn = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(
        withRetry(mockFn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow('Validation error');

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle async functions correctly', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async success';
      };

      const result = await withRetry(asyncFn, { maxRetries: 3 });

      expect(result).toBe('async success');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const error = new Error('network timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      const error = { status: 429, message: 'Rate limit exceeded' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify server errors as retryable', () => {
      const error = { status: 503, message: 'Service unavailable' };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify validation errors as non-retryable', () => {
      const error = new Error('Validation failed');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const startTime = Date.now();
      await sleep(100);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });
});
