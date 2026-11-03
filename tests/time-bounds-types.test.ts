import { describe, it, expect } from 'vitest';
import { formatTimeBoundDuration } from '../packages/types/src/timeBounds';

describe('TimeBounds Types and Formatting', () => {
  it('formats timebound window into minutes and seconds', () => {
    const formatted = formatTimeBoundDuration({
      minTime: 1000,
      maxTime: 1365, // 365 seconds = 6m 5s
    });
    expect(formatted).toBe('6m 5s');
  });

  it('handles unbounded window where maxTime is 0', () => {
    const formatted = formatTimeBoundDuration({
      minTime: 1000,
      maxTime: 0,
    });
    expect(formatted).toBe('Unbounded');
  });
});
