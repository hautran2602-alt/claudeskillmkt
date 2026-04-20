# Internal Credentials — fb_dtsg, jazoest, lsd, cookies

Cho những tool cần gọi **endpoint nội bộ** của FB (`/api/graphql/`, `/ajax/*`,
`/ads/manage/*`). FB yêu cầu bundle credentials phức tạp hơn Graph API.

## fb_dtsg — CSRF Token

**Lấy từ:**
```js
// Cách 1: Module AMD (MAIN world, nhanh nhất)
require('DTSGInitData').token

// Cách 2: Regex script tag (ISOLATED world cũng work)
const m = html.match(/"DTSGInitialData","token":"([^"]+)"/);

// Cách 3: Regex ngắn (fallback)
const m2 = html.match(/"token"\s*:\s*"(NAc[^"]{10,})"/);
// fb_dtsg hiện tại bắt đầu bằng "NAc", prefix có thể đổi
```

**Format:** Chuỗi 50-100 ký tự, bắt đầu bằng `NAc` (hoặc `AAQ`, `AAV`,
tùy thời điểm FB đổi).

**Hết hạn:** Đổi mỗi khi user đăng nhập lại hoặc ~1 giờ idle.

## jazoest — Integrity Check

**CÁCH TÍNH** (không có sẵn trong trang, phải derive):

```js
function computeJazoest(dtsg) {
  let sum = 0;
  for (const ch of dtsg) sum += ch.charCodeAt(0);
  return '2' + sum;
}

// Ví dụ: dtsg = "NAcM1234..." → "2" + (78+65+99+77+49+...) = "24567"
```

Xem template `compute-jazoest.js` — chỉ ~10 dòng.

## lsd — Login State Token

**Lấy từ:**
```js
// Cách 1: Module AMD
require('LSD').token

// Cách 2: Regex (ISOLATED world)
const m = html.match(/"LSD"[^{]*\{[^}]*"token"\s*:\s*"([A-Za-z0-9_\-]+)"/);
```

**Format:** 10-20 ký tự, alphanumeric. Đổi mỗi session.

## Cookies cần thiết

Từ `document.cookie` hoặc `chrome.cookies.getAll()`:

| Cookie | Dùng cho | Ví dụ |
|---|---|---|
| `c_user` | User ID | `"100004567890123"` |
| `xs` | Session signature | `"15%3Aabc...%3A2%3A1234..."` |
| `datr` | Browser fingerprint | 24 ký tự random |
| `sb` | Secure browser ID | 24 ký tự random |
| `fr` | Anti-fraud token | Đổi thường xuyên |
| `wd` | Window dimensions | `1920x1080` — ít quan trọng |
| `presence` | Presence (chat) | Chỉ cần cho messenger |

**Lấy tất cả 1 lần:**
```js
// Trong content script (ISOLATED world)
const cookies = document.cookie.split('; ').reduce((acc, c) => {
  const [k, v] = c.split('=');
  acc[k] = decodeURIComponent(v || '');
  return acc;
}, {});

// Hoặc từ background (cần permission "cookies")
const list = await chrome.cookies.getAll({ domain: '.facebook.com' });
```

## Headers cần thiết cho /api/graphql/

Ví dụ call GraphQL endpoint:

```js
import { buildInternalHeaders } from './build-internal-headers.js';

const headers = buildInternalHeaders({
  fb_dtsg: tokens.fb_dtsg,
  jazoest: computeJazoest(tokens.fb_dtsg),
  lsd: tokens.lsd,
});

const body = new URLSearchParams({
  fb_dtsg: tokens.fb_dtsg,
  jazoest: computeJazoest(tokens.fb_dtsg),
  lsd: tokens.lsd,
  fb_api_caller_class: 'RelayModern',
  fb_api_req_friendly_name: 'AdsManagerCampaignQuery',
  variables: JSON.stringify({ accountID: 'act_123', ... }),
  doc_id: '123456789012345',  // doc_id của query — sniff từ Network tab FB
});

const res = await fetch('https://www.facebook.com/api/graphql/', {
  method: 'POST',
  credentials: 'include',
  headers,
  body,
});
```

## Cách sniff `doc_id` của GraphQL query

1. Mở DevTools → Network tab
2. Vào Ads Manager → thực hiện action cần automate (ví dụ: xoá 1 ad)
3. Lọc requests: `/api/graphql/`
4. Xem Payload → copy `doc_id` + `variables` + `fb_api_req_friendly_name`
5. Paste vào code tool

## Lifetime của từng credential

| Credential | Hết hạn | Re-extract khi |
|---|---|---|
| `access_token` EAA | ~1 giờ (short-lived) hoặc ~60 ngày (long) | Error 190 |
| `fb_dtsg` | Mỗi session (~1 giờ idle) | Error 1357004 |
| `jazoest` | Cùng với fb_dtsg | Cùng với fb_dtsg |
| `lsd` | Mỗi session | Error 100 |
| Cookies | `datr` vài năm, `xs` tới khi logout | Cookie bị clear |

## Race condition cần tránh

Khi rotate, **tất cả 4 thứ** (dtsg, jazoest, lsd, xs) phải rotate cùng lúc.
Pattern chuẩn:

```js
// ❌ SAI: mix credential cũ + mới
const newDtsg = await getNewDtsg();
const oldJazoest = computeJazoest(oldDtsg);  // WRONG
// → FB reject

// ✅ ĐÚNG: rotate atomic
const bundle = await extractAllFromPage();
const jazoest = computeJazoest(bundle.fb_dtsg);  // Derive từ NEW dtsg
```
