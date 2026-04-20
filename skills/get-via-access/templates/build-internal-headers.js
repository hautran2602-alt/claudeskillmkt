/**
 * build-internal-headers.js
 *
 * Helper to build HTTP headers + body for calling FB internal endpoints
 * like /api/graphql/, /ajax/*, /ads/manage/*.
 *
 * These endpoints require a specific set of headers + form-encoded body
 * fields to mimic the real browser. Missing any → FB rejects with
 * error 1357004 (CSRF) or 100 (invalid param).
 */

import { computeJazoest } from './compute-jazoest.js';

/**
 * Build headers for an internal FB request.
 * @param {object} creds
 * @param {string} creds.fb_dtsg
 * @param {string} [creds.lsd]
 * @param {string} [creds.userAgent]
 * @param {string} [creds.friendlyName] - e.g. 'AdsManagerCampaignQuery'
 * @returns {Record<string, string>}
 */
export function buildInternalHeaders(creds) {
  const { fb_dtsg, lsd, userAgent, friendlyName } = creds;
  if (!fb_dtsg) throw new Error('buildInternalHeaders: fb_dtsg required');

  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    'x-fb-lsd': lsd || '',
    'x-asbd-id': '129477',  // Static value as of 2024/2025; update if FB rejects
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'origin': 'https://www.facebook.com',
    'referer': 'https://www.facebook.com/',
  };

  if (userAgent) headers['user-agent'] = userAgent;
  if (friendlyName) headers['x-fb-friendly-name'] = friendlyName;

  return headers;
}

/**
 * Build form body for a GraphQL internal request.
 * @param {object} params
 * @param {string} params.fb_dtsg
 * @param {string} [params.lsd]
 * @param {string} params.docId - GraphQL doc_id (sniff from DevTools)
 * @param {string} params.friendlyName - Operation name
 * @param {object} params.variables - JSON variables
 * @param {string} [params.callerClass='RelayModern']
 * @returns {URLSearchParams}
 */
export function buildGraphqlBody(params) {
  const {
    fb_dtsg, lsd, docId, friendlyName, variables,
    callerClass = 'RelayModern',
  } = params;
  if (!fb_dtsg) throw new Error('buildGraphqlBody: fb_dtsg required');
  if (!docId) throw new Error('buildGraphqlBody: docId required');
  if (!friendlyName) throw new Error('buildGraphqlBody: friendlyName required');

  const body = new URLSearchParams({
    fb_dtsg,
    jazoest: computeJazoest(fb_dtsg),
    fb_api_caller_class: callerClass,
    fb_api_req_friendly_name: friendlyName,
    doc_id: docId,
    variables: JSON.stringify(variables || {}),
  });
  if (lsd) body.set('lsd', lsd);
  return body;
}

/**
 * High-level helper: call a FB internal GraphQL endpoint.
 * @param {object} params - Same as buildGraphqlBody + creds
 * @param {string} [params.url='https://www.facebook.com/api/graphql/']
 * @returns {Promise<any>} Parsed JSON response
 */
export async function callInternalGraphql(params) {
  const {
    url = 'https://www.facebook.com/api/graphql/',
    fb_dtsg, lsd, userAgent, friendlyName, docId, variables,
  } = params;

  const headers = buildInternalHeaders({ fb_dtsg, lsd, userAgent, friendlyName });
  const body = buildGraphqlBody({ fb_dtsg, lsd, docId, friendlyName, variables });

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body,
  });

  const text = await res.text();
  // FB sometimes prefixes response with "for (;;);" as anti-JSON-hijacking
  const clean = text.replace(/^for \(;;\);/, '');
  try {
    return JSON.parse(clean);
  } catch (e) {
    throw new Error(`Internal GraphQL response not JSON: ${text.slice(0, 200)}`);
  }
}
