/**
 * puppeteer-extract.js
 *
 * Node.js helper to extract FB credentials via Puppeteer — for server-side
 * automation tools that can't use a Chrome extension.
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Usage:
 *   import { extractCredentials } from './puppeteer-extract.js';
 *   const creds = await extractCredentials({
 *     userDataDir: 'C:/Users/xxx/AppData/Local/Google/Chrome/User Data',
 *     profile: 'Default',
 *     headless: false,  // Must be false first time to login
 *   });
 *   console.log(creds);  // { access_token, fb_dtsg, jazoest, lsd, user_id, cookies }
 *
 * IMPORTANT: Point userDataDir at a COPY of your Chrome profile, not the live
 * one — Chrome locks the profile folder if the main browser is running.
 */

import puppeteer from 'puppeteer';

const EXTRACT_FN = `(async () => {
  const r = {};
  const EAA_PATTERNS = [
    /"accessToken"\\s*:\\s*"(EAA[A-Za-z0-9_\\-]{30,})"/,
    /"access_token"\\s*:\\s*"(EAA[A-Za-z0-9_\\-]{30,})"/,
    /accessToken=(EAA[A-Za-z0-9_\\-]{30,})/,
    /"token"\\s*:\\s*"(EAA[A-Za-z0-9_\\-]{30,})"/,
    /\\bEAA[A-Za-z0-9_\\-]{30,}/,
  ];
  const findEAA = (t) => {
    for (const p of EAA_PATTERNS) {
      const m = t.match(p);
      if (m) {
        const tok = m[1] || m[0];
        if (tok.startsWith('EAA') && tok.length >= 30) return tok;
      }
    }
    return null;
  };

  // 1. AMD require (MAIN world)
  try {
    if (typeof require === 'function') {
      try { r.fb_dtsg = require('DTSGInitData').token; } catch (_) {}
      try { r.user_id = require('CurrentUserInitialData').USER_ID; } catch (_) {}
      try { r.lsd = require('LSD').token; } catch (_) {}
      try { r.access_token = require('CurrentAccessToken')?.ACCESS_TOKEN; } catch (_) {}
    }
  } catch (_) {}

  // 2. script tags
  try {
    for (const s of document.querySelectorAll('script')) {
      const t = s.textContent || '';
      if (!r.access_token) r.access_token = findEAA(t);
      if (!r.fb_dtsg) {
        const m = t.match(/"token"\\s*:\\s*"(NAc[^"]{10,})"/);
        if (m) r.fb_dtsg = m[1];
      }
      if (!r.user_id) {
        const m = t.match(/"USER_ID"\\s*:\\s*"(\\d{5,})"/);
        if (m) r.user_id = m[1];
      }
      if (r.access_token && r.fb_dtsg && r.user_id) break;
    }
  } catch (_) {}

  // 3. HTML brute-force
  if (!r.access_token) {
    try { r.access_token = findEAA(document.documentElement.outerHTML); } catch (_) {}
  }

  // Compute jazoest
  if (r.fb_dtsg) {
    let sum = 0;
    for (const ch of r.fb_dtsg) sum += ch.charCodeAt(0);
    r.jazoest = '2' + sum;
  }

  return r;
})()`;

/**
 * Extract credentials from a logged-in FB session via Puppeteer.
 * @param {object} opts
 * @param {string} [opts.userDataDir] - Chrome user data dir (recommended)
 * @param {string} [opts.profile='Default'] - Profile name
 * @param {boolean} [opts.headless=false] - Must be false for first login
 * @param {string} [opts.startUrl='https://adsmanager.facebook.com/adsmanager/manage/campaigns']
 * @param {number} [opts.navTimeout=30000]
 * @param {number} [opts.retryCount=3]
 * @param {number} [opts.retryDelay=2000]
 * @returns {Promise<object>} credentials
 */
export async function extractCredentials(opts = {}) {
  const {
    userDataDir,
    profile = 'Default',
    headless = false,
    startUrl = 'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
    navTimeout = 30000,
    retryCount = 3,
    retryDelay = 2000,
  } = opts;

  const launchOpts = {
    headless,
    defaultViewport: null,
    args: [`--profile-directory=${profile}`],
  };
  if (userDataDir) launchOpts.userDataDir = userDataDir;

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: navTimeout });

    // Retry extraction if page still rendering
    let creds = null;
    for (let i = 0; i < retryCount; i++) {
      creds = await page.evaluate(EXTRACT_FN);
      if (creds.access_token && creds.fb_dtsg) break;
      await new Promise((r) => setTimeout(r, retryDelay));
    }

    if (!creds || !creds.access_token) {
      throw new Error('Failed to extract access_token. Make sure you are logged in.');
    }

    // Add cookies (requires separate API call)
    const cookies = await page.cookies();
    creds.cookies = {};
    for (const c of cookies) {
      if (['c_user', 'xs', 'datr', 'sb', 'fr'].includes(c.name)) {
        creds.cookies[c.name] = c.value;
      }
    }

    return creds;
  } finally {
    await browser.close();
  }
}

/**
 * CLI entry: node puppeteer-extract.js [userDataDir]
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const userDataDir = process.argv[2];
  extractCredentials({ userDataDir, headless: false })
    .then((creds) => {
      console.log('Extracted credentials:');
      console.log(JSON.stringify({
        ...creds,
        access_token: creds.access_token ? `EAA***${creds.access_token.slice(-6)}` : null,
      }, null, 2));
    })
    .catch((e) => {
      console.error('ERROR:', e.message);
      process.exit(1);
    });
}
