export interface TimeBoundWindow {
  minTime: number; // Unix timestamp in seconds (0 = unbounded start)
  maxTime: number; // Unix timestamp in seconds (0 = unbounded end)
}

export interface TimeBoundEvaluation {
  isValid: boolean;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'INVALID_WINDOW';
  secondsUntilActive?: number;
  secondsRemaining?: number;
  reason?: string;
}

export class TimeBoundValidator {
  /**
   * Validates if the current wall-clock / ledger time falls within transaction time bounds
   */
  static evaluateTimeBounds(
    bounds: TimeBoundWindow,
    currentTime: number = Math.floor(Date.now() / 1000)
  ): TimeBoundEvaluation {
    if (bounds.minTime < 0 || bounds.maxTime < 0) {
      return {
        isValid: false,
        status: 'INVALID_WINDOW',
        reason: 'Timestamps cannot be negative',
      };
    }

    if (bounds.maxTime > 0 && bounds.minTime > bounds.maxTime) {
      return {
        isValid: false,
        status: 'INVALID_WINDOW',
        reason: 'minTime cannot be greater than maxTime',
      };
    }

    // Check if not yet reached
    if (bounds.minTime > 0 && currentTime < bounds.minTime) {
      return {
        isValid: false,
        status: 'PENDING',
        secondsUntilActive: bounds.minTime - currentTime,
        reason: `Transaction not valid until ${new Date(bounds.minTime * 1000).toISOString()}`,
      };
    }

    // Check if expired
    if (bounds.maxTime > 0 && currentTime > bounds.maxTime) {
      return {
        isValid: false,
        status: 'EXPIRED',
        reason: `Transaction expired at ${new Date(bounds.maxTime * 1000).toISOString()}`,
      };
    }

    const secondsRemaining = bounds.maxTime > 0 ? bounds.maxTime - currentTime : undefined;

    return {
      isValid: true,
      status: 'ACTIVE',
      secondsRemaining,
    };
  }

  /**
   * Generates a recommended standard 5-minute transaction validity window
   */
  static generateDefaultWindow(
    validitySeconds: number = 300,
    now: number = Math.floor(Date.now() / 1000)
  ): TimeBoundWindow {
    return {
      minTime: Math.max(0, now - 60), // Grace period for small clock drifts
      maxTime: now + validitySeconds,
    };
  }
}
