/**
 * content-hook.js — MAIN world content script
 *
 * Extracts Facebook credentials (access_token, fb_dtsg, jazoest, lsd, user_id,
 * cookies) from a logged-in FB page. Runs in MAIN world so it can access
 * Facebook's internal AMD `require()` modules.
 *
 * Register in manifest.json:
 * {
 *   "content_scripts": [{
 *     "matches": ["https://*.facebook.com/*"],
 *     "js": ["content-hook.js"],
 *     "run_at": "document_idle",
 *     "world": "MAIN"
 *   }]
 * }
 *
 * Pairs with content-bridge.js (ISOLATED world) which relays messages between
 * this hook and the extension's background/popup.
 */
(function () {
  'use strict';

  // Change this CH constant per-project to avoid cross-extension collisions.
  const CH = '__fbaccess_v1';

  // EAA token detection patterns (priority order: specific → generic)
  const EAA_PATTERNS = [
    /"accessToken"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
    /"access_token"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
    /accessToken=(EAA[A-Za-z0-9_\-]{30,})/,
    /access_token=(EAA[A-Za-z0-9_\-]{30,})/,
    /"token"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/,
    /\bEAA[A-Za-z0-9_\-]{30,}/,
  ];

  function findEAA(text) {
    for (const p of EAA_PATTERNS) {
      const m = text.match(p);
      if (m) {
        const tok = m[1] || m[0];
        if (tok.startsWith('EAA') && tok.length >= 30) return tok;
      }
    }
    return null;
  }

  /**
   * Extract cookies from document.cookie (MAIN world can read these too).
   * Returns object with individual cookies keyed by name.
   */
  function extractCookies() {
    const out = {};
    try {
      document.cookie.split('; ').forEach((c) => {
        const idx = c.indexOf('=');
        if (idx < 0) return;
        const k = c.slice(0, idx);
        const v = decodeURIComponent(c.slice(idx + 1) || '');
        if (['c_user', 'xs', 'datr', 'sb', 'fr', 'presence', 'wd'].includes(k)) {
          out[k] = v;
        }
      });
    } catch (_) {}
    return out;
  }

  /**
   * Main extraction — tries 6 sources in priority order:
   *   1. FB AMD require() modules (fastest when present)
   *   2. <script> tags regex scan
   *   3. Full HTML brute-force fallback
   *   4. window.__* globals
   *   5. sessionStorage + localStorage
   *   6. Performance Resource Timing API
   */
  function extract() {
    const r = { cookies: extractCookies() };

    // ── 1. FB AMD require() modules ──────────────────────────────────────
    try {
      if (typeof require === 'function') {
        try { r.fb_dtsg = require('DTSGInitData').token; }            catch (_) {}
        try { r.user_id = require('CurrentUserInitialData').USER_ID; } catch (_) {}
        try { r.lsd     = require('LSD').token; }                      catch (_) {}
        try { r.access_token = require('CurrentAccessToken')?.ACCESS_TOKEN; } catch (_) {}
        if (!r.access_token) try { r.access_token = require('AccessToken')?.ACCESS_TOKEN; } catch (_) {}
        if (!r.access_token) try {
          const env = require('Env');
          r.access_token = env?.access_token || env?.accessToken;
        } catch (_) {}
        if (!r.access_token) try {
          const gk = require('AdsGKStore');
          if (gk?.accessToken) r.access_token = gk.accessToken;
        } catch (_) {}
      }
    } catch (_) {}

    // ── 2. <script> tags regex scan ──────────────────────────────────────
    try {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const t = s.textContent || '';
        if (!t || t.length < 10) continue;

        if (!r.fb_dtsg) {
          const m = t.match(/"DTSGInitialData".*?"token"\s*:\s*"([^"]+)"/)
                 || t.match(/"token"\s*:\s*"(NAc[^"]{10,})"/);
          if (m) r.fb_dtsg = m[1];
        }
        if (!r.user_id) {
          const m = t.match(/"USER_ID"\s*:\s*"(\d{5,})"/);
          if (m) r.user_id = m[1];
        }
        if (!r.access_token) r.access_token = findEAA(t);
        if (!r.lsd) {
          const m = t.match(/"LSD"[^{]*\{[^}]*"token"\s*:\s*"([A-Za-z0-9_\-]+)"/);
          if (m) r.lsd = m[1];
        }
        if (r.fb_dtsg && r.user_id && r.access_token && r.lsd) break;
      }
    } catch (_) {}

    // ── 3. Full HTML brute-force ─────────────────────────────────────────
    if (!r.access_token) {
      try {
        const html = document.documentElement?.outerHTML || '';
        r.access_token = findEAA(html);
      } catch (_) {}
    }

    // ── 4. window.__* globals ────────────────────────────────────────────
    if (!r.access_token) {
      try {
        const candidates = [
          window.__accessToken,
          window.__NEXT_DATA__?.props?.accessToken,
          window._sharedData?.config?.csrf_token,
        ];
        for (const c of candidates) {
          if (typeof c === 'string' && c.startsWith('EAA') && c.length >= 30) {
            r.access_token = c; break;
          }
        }
      } catch (_) {}
    }

    // ── 5. sessionStorage + localStorage ─────────────────────────────────
    if (!r.access_token) {
      try {
        for (const store of [sessionStorage, localStorage]) {
          for (let i = 0; i < store.length; i++) {
            const v = store.getItem(store.key(i)) || '';
            if (v.includes('EAA')) {
              const tok = findEAA(v);
              if (tok) { r.access_token = tok; break; }
            }
          }
          if (r.access_token) break;
        }
      } catch (_) {}
    }

    // ── 6. Performance Resource Timing ───────────────────────────────────
    if (!r.access_token) {
      try {
        const entries = performance.getEntriesByType('resource');
        for (const e of entries) {
          if (e.name.includes('access_token=EAA') || e.name.includes('accessToken=EAA')) {
            const tok = findEAA(e.name);
            if (tok) { r.access_token = tok; break; }
          }
        }
      } catch (_) {}
    }

    // Compute jazoest on the fly if fb_dtsg present
    if (r.fb_dtsg && !r.jazoest) {
      let sum = 0;
      for (const ch of r.fb_dtsg) sum += ch.charCodeAt(0);
      r.jazoest = '2' + sum;
    }

    return r;
  }

  // ── Listen for extraction requests from bridge ─────────────────────────
  window.addEventListener('message', function (e) {
    if (e.source !== window || !e.data || e.data.ch !== CH || e.data.cmd !== 'get-tokens') return;
    const id = e.data.id;

    // Polling: FB may not have rendered yet → retry every 400ms up to 25 times (10s total)
    let n = 0;
    (function poll() {
      const tokens = extract();
      const enough = (tokens.fb_dtsg && tokens.access_token)
                  || tokens.user_id
                  || n >= 25;
      if (enough) {
        window.postMessage({ ch: CH, re: id, tokens }, '*');
      } else {
        n++;
        setTimeout(poll, 400);
      }
    })();
  });
})();
