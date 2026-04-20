/**
 * compute-jazoest.js
 *
 * jazoest is FB's integrity check derived from fb_dtsg.
 * Formula: "2" + sum(charCode of each char in fb_dtsg)
 *
 * Example:
 *   fb_dtsg = "NAcM1234..."
 *   charCodes = [78, 65, 99, 77, 49, 50, 51, 52, ...]
 *   sum = 78 + 65 + 99 + 77 + 49 + 50 + 51 + 52 + ... = 3456
 *   jazoest = "23456"
 *
 * FB internal endpoints (/api/graphql/, /ajax/*) check that jazoest matches
 * fb_dtsg — if not, request is rejected with error 1357004.
 */

/**
 * Compute jazoest from fb_dtsg.
 * @param {string} fbDtsg - The fb_dtsg CSRF token
 * @returns {string} jazoest value
 * @throws {Error} if fbDtsg is falsy or not a string
 */
export function computeJazoest(fbDtsg) {
  if (!fbDtsg || typeof fbDtsg !== 'string') {
    throw new Error('computeJazoest: fb_dtsg must be a non-empty string');
  }
  let sum = 0;
  for (let i = 0; i < fbDtsg.length; i++) {
    sum += fbDtsg.charCodeAt(i);
  }
  return '2' + sum;
}

/**
 * Verify a jazoest value matches an fb_dtsg.
 * @param {string} fbDtsg
 * @param {string} jazoest
 * @returns {boolean}
 */
export function verifyJazoest(fbDtsg, jazoest) {
  try {
    return computeJazoest(fbDtsg) === jazoest;
  } catch (_) {
    return false;
  }
}
