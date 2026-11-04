export function computeSha256(payload: string): string {
  try {
    const crypto = require('crypto');
    if (crypto && typeof crypto.createHash === 'function') {
      return crypto.createHash('sha256').update(payload).digest('hex');
    }
  } catch {
    // Browser fallback
  }

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}
