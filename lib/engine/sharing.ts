/**
 * Privacy-Preserving Link Sharing
 * 
 * Rules:
 * - NEVER send user answers to server or any log.
 * - Client-side URL hash only.
 * - Encode only valid question answer keys (e.g. q_*).
 * - Strictly filter out any potential personal identifiable information (PII).
 */

export function encodeAnswersToShareHash(answers: Record<string, any>): string {
  // Filter to keep only question keys (q_*) and sanitize values
  const cleanAnswers: Record<string, any> = {};

  for (const [key, value] of Object.entries(answers)) {
    if (!key.startsWith('q_')) continue;

    // Only allow primitive types: string, number, boolean
    if (typeof value === 'boolean' || typeof value === 'number') {
      cleanAnswers[key] = value;
    } else if (typeof value === 'string') {
      // Reject any string that looks like an email or 10-digit phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^[0-9+()-\s]{9,15}$/.test(value.trim()) && /\d{4,}/.test(value);
      if (!isEmail && !isPhone) {
        cleanAnswers[key] = value;
      }
    }
  }

  const jsonStr = JSON.stringify(cleanAnswers);

  // Encode to URL-safe Base64
  let encoded = '';
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    encoded = window.btoa(unescape(encodeURIComponent(jsonStr)));
  } else {
    encoded = Buffer.from(jsonStr, 'utf-8').toString('base64');
  }

  // Replace + / = with URL safe characters
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeAnswersFromShareHash(hash: string): Record<string, any> | null {
  if (!hash) return null;

  try {
    // Remove leading # or share= if present
    let raw = hash.replace(/^#/, '');
    if (raw.startsWith('share=')) {
      raw = raw.slice(6);
    }

    // Restore URL safe base64 characters
    let base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(escape(window.atob(base64)));
    } else {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    // Ensure all keys are q_*
    const validated: Record<string, any> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (k.startsWith('q_')) {
        validated[k] = v;
      }
    }

    return validated;
  } catch (err) {
    return null;
  }
}

