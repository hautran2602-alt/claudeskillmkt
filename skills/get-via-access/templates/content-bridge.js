/**
 * content-bridge.js — ISOLATED world content script
 *
 * Bridges chrome.runtime messages to/from the MAIN-world content-hook.js.
 *
 * Why this exists:
 * - Extension runtime (chrome.runtime.sendMessage) only works in ISOLATED world
 * - FB AMD require() only works in MAIN world
 * - This bridge relays messages between the two via window.postMessage
 *
 * Register in manifest.json:
 * {
 *   "content_scripts": [{
 *     "matches": ["https://*.facebook.com/*"],
 *     "js": ["content-bridge.js"],
 *     "run_at": "document_idle"
 *   }]
 * }
 *
 * Usage from background/popup:
 *   const r = await chrome.tabs.sendMessage(tabId, { cmd: 'get-tokens' });
 *   // r = { ok: true, tokens: { access_token, fb_dtsg, jazoest, lsd, user_id, cookies } }
 */
(function () {
  'use strict';

  // Must match content-hook.js
  const CH = '__fbaccess_v1';

  chrome.runtime.onMessage.addListener(function (msg, _sender, respond) {
    if (msg.cmd !== 'get-tokens') return false;

    const id = Math.random().toString(36).slice(2) + Date.now();

    function onReply(e) {
      if (!e.data || e.data.ch !== CH || e.data.re !== id) return;
      window.removeEventListener('message', onReply);
      respond({ ok: true, tokens: e.data.tokens });
    }

    window.addEventListener('message', onReply);
    window.postMessage({ ch: CH, cmd: 'get-tokens', id }, '*');

    // Timeout after 8 seconds (hook itself retries 25 × 400ms = 10s)
    setTimeout(function () {
      window.removeEventListener('message', onReply);
      respond({ ok: false, error: 'Timeout extracting tokens (8s). Reload the FB tab and retry.' });
    }, 8000);

    return true; // Signal async response
  });
})();
