/**
 * bg-fetch-credentials.js — Background Service Worker (MV3)
 *
 * PRIMARY APPROACH: Extract full FB credentials WITHOUT requiring user to open
 * any Facebook tab. Works as long as user is logged in to FB in the Chrome
 * profile at least once (cookies persist).
 *
 * How it works:
 *   1. chrome.cookies.get(...) → pull c_user, xs, datr, sb, fr, presence
 *   2. fetch('https://business.facebook.com/...', {credentials:'include'})
 *      → Chrome auto-attaches FB cookies → FB returns HTML containing tokens
 *   3. Regex extract EAA access_token, fb_dtsg, lsd, user_id
 *   4. Compute jazoest locally from fb_dtsg
 *   5. Return full bundle to caller (popup, dashboard, etc.)
 *
 * Required manifest permissions:
 *   "permissions": ["cookies", "declarativeNetRequest", "storage"]
 *   "host_permissions": [
 *     "https://*.facebook.com/*",
 *     "https://graph.facebook.com/*"
 *   ]
 *
 * Also need dnr-rules.json to spoof origin/referer headers (so FB trusts
 * the fetch as if it came from a real browser tab).
 *
 * Usage (in background.js):
 *   import { fetchCredentials } from './bg-fetch-credentials.js';
 *   chrome.runtime.onMessage.addListener((msg, _s, sendResp) => {
 *     if (msg.type === 'GET_CREDS') {
 *       fetchCredentials().then(sendResp);
 *       return true;  // async response
 *     }
 *   });
 */

// ============================================================
// Config
// ============================================================

const FB_COOKIE_NAMES = ['c_user', 'xs', 'datr', 'sb', 'fr', 'presence', 'wd'];

// URLs ranked by probability of containing EAA access_token
const FETCH_URLS = [
  'https://business.facebook.com/business_locations',
  'https://business.facebook.com/latest/home',
  'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
  'https://www.facebook.com/adsmanager/manage/accounts',
];

const EAA_PATTERNS = [
  /"accessToken"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
  /"access_token"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
  /accessToken=(EAA[A-Za-z0-9_\-]{30,})/,
  /access_token=(EAA[A-Za-z0-9_\-]{30,})/,
  /"token"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
  /\bEAA[A-Za-z0-9_\-]{30,}/,
];

const DTSG_PATTERNS = [
  /"DTSGInitialData"[^}]*?"token"\s*:\s*"([^"]+)"/,
  /"dtsg":\{"token":"([^"]+)"/,
  /name="fb_dtsg"\s+value="([^"]+)"/,
];

const LSD_PATTERNS = [
  /"LSD",\[\],\{"token":"([^"]+)"\}/,
  /"lsd":"([^"]+)"/,
  /name="lsd"\s+value="([^"]+)"/,
];

const USER_ID_PATTERNS = [
  /"USER_ID"\s*:\s*"(\d{5,})"/,
  /"actorID"\s*:\s*"(\d{5,})"/,
  /"viewer_id"\s*:\s*"(\d{5,})"/,
];

// ============================================================
// Helpers
// ============================================================

function firstMatch(text, patterns) {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const v = m[1] || m[0];
      if (v) return v;
    }
  }
  return null;
}

function computeJazoest(fbDtsg) {
  if (!fbDtsg) return null;
  let sum = 0;
  for (let i = 0; i < fbDtsg.length; i++) sum += fbDtsg.charCodeAt(i);
  return '2' + sum;
}

async function getFBCookies() {
  const out = {};
  for (const name of FB_COOKIE_NAMES) {
    // Try www.facebook.com first, then .facebook.com domain
    try {
      let c = await chrome.cookies.get({
        url: 'https://www.facebook.com',
        name,
      });
      if (!c) {
        c = await chrome.cookies.get({
          url: 'https://business.facebook.com',
          name,
        });
      }
      if (c?.value) out[name] = c.value;
    } catch (_) {}
  }
  return out;
}

async function fetchPageHtml(url) {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'upgrade-insecure-requests': '1',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (_) {
    return null;
  }
}

function extractFromHtml(html) {
  if (!html || html.length < 1000) return {};
  return {
    access_token: firstMatch(html, EAA_PATTERNS),
    fb_dtsg: firstMatch(html, DTSG_PATTERNS),
    lsd: firstMatch(html, LSD_PATTERNS),
    user_id: firstMatch(html, USER_ID_PATTERNS),
  };
}

// ============================================================
// Main API
// ============================================================

/**
 * Fetch full FB credentials bundle. No FB tab required.
 *
 * @param {object} [opts]
 * @param {string[]} [opts.urls] - Override URL list to try
 * @param {boolean} [opts.includeCookies=true] - Include cookies in result
 * @returns {Promise<{
 *   access_token?: string,
 *   fb_dtsg?: string,
 *   jazoest?: string,
 *   lsd?: string,
 *   user_id?: string,
 *   cookies?: Record<string, string>,
 *   _source?: string,
 *   _error?: string,
 * }>}
 */
export async function fetchCredentials(opts = {}) {
  const { urls = FETCH_URLS, includeCookies = true } = opts;
  const result = {};

  // 1. Cookies first (can fail gracefully if no FB login)
  if (includeCookies) {
    result.cookies = await getFBCookies();
    if (!result.cookies.c_user) {
      return {
        _error: 'NOT_LOGGED_IN',
        _message: 'No c_user cookie found. User must log in to Facebook in this Chrome profile first.',
        cookies: result.cookies,
      };
    }
    result.user_id = result.cookies.c_user;  // fallback user_id from cookie
  }

  // 2. Try each URL until we have at least access_token + fb_dtsg
  for (const url of urls) {
    const html = await fetchPageHtml(url);
    if (!html) continue;

    const extracted = extractFromHtml(html);
    // Merge: prefer first non-empty value
    if (!result.access_token && extracted.access_token) {
      result.access_token = extracted.access_token;
      result._source = url;
    }
    if (!result.fb_dtsg && extracted.fb_dtsg) result.fb_dtsg = extracted.fb_dtsg;
    if (!result.lsd && extracted.lsd) result.lsd = extracted.lsd;
    if (!result.user_id && extracted.user_id) result.user_id = extracted.user_id;

    // Stop early if we have the critical pair
    if (result.access_token && result.fb_dtsg) break;
  }

  // 3. Compute jazoest locally
  if (result.fb_dtsg) result.jazoest = computeJazoest(result.fb_dtsg);

  // 4. Report what's missing (caller can decide retry/fallback)
  if (!result.access_token) {
    result._warning = 'access_token_not_found';
  }

  return result;
}

/**
 * Quick health check — are we able to reach FB with current cookies?
 * @returns {Promise<{ok: boolean, user_id?: string, error?: string}>}
 */
export async function checkFBSession() {
  const cookies = await getFBCookies();
  if (!cookies.c_user) return { ok: false, error: 'NOT_LOGGED_IN' };

  try {
    const res = await fetch('https://www.facebook.com/', {
      credentials: 'include',
      method: 'HEAD',
    });
    return { ok: res.ok, user_id: cookies.c_user };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Mask token for safe logging.
 */
export function maskToken(token) {
  if (!token || typeof token !== 'string' || token.length < 10) return '***';
  return `${token.slice(0, 4)}***${token.slice(-6)}`;
}
