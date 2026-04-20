/**
 * validate-token.js — Check if a FB access_token is still valid.
 *
 * Calls GET /v21.0/me?access_token=... which is the cheapest validation
 * endpoint. Returns { valid, id, name, error }.
 */

/**
 * Validate a Facebook access_token.
 * @param {string} token - EAA access token
 * @param {object} [options]
 * @param {string} [options.version='v21.0'] - Graph API version
 * @param {string} [options.fields='id,name'] - Fields to fetch for validation
 * @param {number} [options.timeout=8000] - ms
 * @returns {Promise<{valid: boolean, id?: string, name?: string, error?: string, code?: number}>}
 */
export async function validateToken(token, options = {}) {
  const { version = 'v21.0', fields = 'id,name', timeout = 8000 } = options;

  if (!token || typeof token !== 'string' || !token.startsWith('EAA')) {
    return { valid: false, error: 'Invalid token format (must start with EAA)' };
  }

  const url = `https://graph.facebook.com/${version}/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);

  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const json = await res.json();
    if (json.error) {
      return {
        valid: false,
        error: json.error.message || 'Unknown error',
        code: json.error.code,
        subcode: json.error.error_subcode,
      };
    }
    return { valid: true, id: json.id, name: json.name };
  } catch (e) {
    return { valid: false, error: e.message || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mask a token for safe logging — only show last 6 chars.
 * @param {string} token
 * @returns {string}
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string') return '';
  if (token.length < 10) return '***';
  return `EAA***${token.slice(-6)}`;
}

/**
 * Quick boolean check — does this string LOOK like a valid EAA token?
 * Does NOT call network.
 * @param {string} s
 * @returns {boolean}
 */
export function looksLikeEAA(s) {
  return typeof s === 'string' && /^EAA[A-Z][A-Za-z0-9_\-]{27,}$/.test(s);
}
