/**
 * validate-token.js — Check if a FB access_token is still valid.
 *
 * Calls GET /v21.0/me?access_token=... which is the cheapest validation
 * endpoint. Returns { valid, id, name, error }.
 *
 * v1.1: added in-memory cache (60s TTL) + reduced default timeout to 5s.
 */

// Cache: token -> { result, expiresAt }
const _cache = new Map();
const CACHE_TTL_MS = 60_000;  // 60s

/**
 * Validate a Facebook access_token.
 * @param {string} token - EAA access token
 * @param {object} [options]
 * @param {string} [options.version='v21.0']
 * @param {string} [options.fields='id'] - Minimal for speed; add 'name' if needed
 * @param {number} [options.timeout=5000] - ms
 * @param {boolean} [options.bypassCache=false]
 * @returns {Promise<{valid: boolean, id?: string, name?: string, error?: string, code?: number, _cached?: boolean}>}
 */
export async function validateToken(token, options = {}) {
  const {
    version = 'v21.0',
    fields = 'id',
    timeout = 5000,
    bypassCache = false,
  } = options;

  if (!token || typeof token !== 'string' || !token.startsWith('EAA')) {
    return { valid: false, error: 'Invalid token format (must start with EAA)' };
  }

  // Cache check
  const cacheKey = `${token}|${fields}`;
  if (!bypassCache) {
    const hit = _cache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      return { ...hit.result, _cached: true };
    }
  }

  const url = `https://graph.facebook.com/${version}/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  let result;
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    if (json.error) {
      result = {
        valid: false,
        error: json.error.message || 'Unknown error',
        code: json.error.code,
        subcode: json.error.error_subcode,
      };
    } else {
      result = { valid: true, id: json.id, name: json.name };
    }
  } catch (e) {
    result = {
      valid: false,
      error: e.name === 'AbortError' ? `Timeout ${timeout}ms` : (e.message || String(e)),
    };
  } finally {
    clearTimeout(timer);
  }

  // Cache positive + short-lived negative results
  _cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

/**
 * Clear the validation cache (call on token rotation).
 */
export function clearValidationCache() {
  _cache.clear();
}

/**
 * Mask a token for safe logging — only show last 6 chars.
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string') return '';
  if (token.length < 10) return '***';
  return `EAA***${token.slice(-6)}`;
}

/**
 * Quick boolean check — does this string LOOK like a valid EAA token?
 */
export function looksLikeEAA(s) {
  return typeof s === 'string' && /^EAA[A-Z][A-Za-z0-9_\-]{27,}$/.test(s);
}
