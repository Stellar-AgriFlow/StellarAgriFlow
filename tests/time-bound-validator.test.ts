import { describe, it, expect } from 'vitest';
import {
  TimeBoundValidator,
  TimeBoundWindow,
} from '../packages/contracts-client/src/timeBoundValidator';

describe('TimeBoundValidator SDK', () => {
  const baseTime = 1700000000;

  it('validates active transaction window within minTime and maxTime', () => {
    const bounds: TimeBoundWindow = {
      minTime: baseTime - 60,
      maxTime: baseTime + 300,
    };

    const res = TimeBoundValidator.evaluateTimeBounds(bounds, baseTime);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('ACTIVE');
    expect(res.secondsRemaining).toBe(300);
  });

  it('detects pending transaction that is not yet valid', () => {
    const bounds: TimeBoundWindow = {
      minTime: baseTime + 100,
      maxTime: baseTime + 500,
    };

    const res = TimeBoundValidator.evaluateTimeBounds(bounds, baseTime);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('PENDING');
    expect(res.secondsUntilActive).toBe(100);
    expect(res.reason).toContain('not valid until');
  });

  it('detects expired transaction and rejects execution', () => {
    const bounds: TimeBoundWindow = {
      minTime: baseTime - 500,
      maxTime: baseTime - 50,
    };

    const res = TimeBoundValidator.evaluateTimeBounds(bounds, baseTime);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('EXPIRED');
    expect(res.reason).toContain('Transaction expired');
  });

  it('rejects malformed timebound window where minTime > maxTime', () => {
    const bounds: TimeBoundWindow = {
      minTime: baseTime + 500,
      maxTime: baseTime + 100,
    };

    const res = TimeBoundValidator.evaluateTimeBounds(bounds, baseTime);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('INVALID_WINDOW');
  });

  it('generates standard recommended 5-minute transaction validity window', () => {
    const defaultWindow = TimeBoundValidator.generateDefaultWindow(300, baseTime);
    expect(defaultWindow.minTime).toBe(baseTime - 60);
    expect(defaultWindow.maxTime).toBe(baseTime + 300);
  });
});
