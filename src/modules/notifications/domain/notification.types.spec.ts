import {
  calculateBackoffMs,
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
} from './notification.types';

describe('calculateBackoffMs', () => {
  it('should return 1000ms for retryCount 0', () => {
    expect(calculateBackoffMs(0)).toBe(BACKOFF_BASE_MS);
  });

  it('should return 2000ms for retryCount 1', () => {
    expect(calculateBackoffMs(1)).toBe(2000);
  });

  it('should return 4000ms for retryCount 2', () => {
    expect(calculateBackoffMs(2)).toBe(4000);
  });

  it('should return 8000ms for retryCount 3', () => {
    expect(calculateBackoffMs(3)).toBe(8000);
  });

  it('should return 16000ms for retryCount 4', () => {
    expect(calculateBackoffMs(4)).toBe(16000);
  });

  it('should cap at BACKOFF_MAX_MS for high retryCount', () => {
    const result = calculateBackoffMs(10);
    expect(result).toBe(BACKOFF_MAX_MS);
    expect(result).toBeLessThanOrEqual(BACKOFF_MAX_MS);
  });

  it('should grow exponentially', () => {
    const r0 = calculateBackoffMs(0);
    const r1 = calculateBackoffMs(1);
    const r2 = calculateBackoffMs(2);
    expect(r1).toBe(r0 * 2);
    expect(r2).toBe(r1 * 2);
  });
});
