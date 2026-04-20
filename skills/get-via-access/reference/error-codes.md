# FB Error Codes — Hành động tương ứng

Khi gọi Graph API hoặc internal endpoint, FB trả error với `code` và `message`.
Bảng sau giúp tool quyết định hành động ngay lập tức.

## Nhóm AUTH — cần rotate credentials

| Code | `error_subcode` | Nghĩa | Hành động |
|---|---|---|---|
| 190 | — | Token invalid / expired | Rotate ngay, không retry |
| 190 | 458 | App not installed | User chưa grant quyền |
| 190 | 459 | User checkpoint (account bị FB verify) | Báo user check account |
| 190 | 460 | Password changed | Rotate + báo re-login |
| 190 | 463 | Session expired | Rotate |
| 190 | 464 | Session invalid | Rotate |
| 190 | 467 | Session changed (logged in elsewhere) | Rotate |
| 102 | — | Session key invalid | Rotate |

**Hành động chuẩn cho nhóm này:**
```js
if (error.code === 190 || error.code === 102) {
  invalidateTokens();  // Clear cache
  const fresh = await extractCredentials();  // Re-trigger content-hook
  retry(fresh);
}
```

## Nhóm THROTTLE — rate limit, cần chờ & bisect

| Code | Nghĩa | Hành động |
|---|---|---|
| 1 | Unknown | Retry với backoff, bisect nếu batch |
| 2 | Service temporarily unavailable | Retry sau 2-5s |
| 4 | Application request limit | Exponential backoff + bisect |
| 17 | User request limit reached | Wait 1-5 phút, skip user này |
| 32 | Page request limit | Wait + bisect |
| 368 | Temporarily blocked (FB anti-spam) | Wait 3-10s, rồi retry |
| 613 | Rate limit custom | Backoff |
| 80004 | Ads permission limit | Bisect TKQC batch |

**Hành động chuẩn:**
```js
const THROTTLE_CODES = [1, 2, 4, 17, 32, 368, 613, 80004];

async function tryWithBisect(fn, batch, depth = 0) {
  try {
    return await fn(batch);
  } catch (e) {
    if (THROTTLE_CODES.includes(e.code) && batch.length > 1 && depth < 3) {
      const mid = Math.ceil(batch.length / 2);
      const a = await tryWithBisect(fn, batch.slice(0, mid), depth + 1);
      const b = await tryWithBisect(fn, batch.slice(mid), depth + 1);
      return [...a, ...b];
    }
    // Retry với exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      await sleep(500 * Math.pow(2, attempt));
      try { return await fn(batch); } catch (_) {}
    }
    throw e;
  }
}
```

## Nhóm PERMISSION — cần grant hoặc skip

| Code | Nghĩa | Hành động |
|---|---|---|
| 10 | App permission required | User chưa grant `ads_read`, `ads_management`… |
| 100 | Invalid parameter | Bỏ field không hỗ trợ, retry |
| 200 | Permission denied | TK bị limit quyền, skip |
| 294 | App not authorized | Cần re-auth |

## Nhóm INTERNAL ENDPOINT

| Code | Nghĩa | Hành động |
|---|---|---|
| 1357004 | CSRF token mismatch | Rotate `fb_dtsg` + `jazoest` |
| 1357001 | Invalid session | Rotate cookies + re-extract |
| 1390008 | Missing required field | Check payload |
| 1390013 | Invalid ad account state | TK disabled, skip |

## Nhóm BILLING-SPECIFIC

Khi gọi `/act_X/activities?category=ACCOUNT_BILLING_CHARGES`:

| Code | Nghĩa | Hành động |
|---|---|---|
| 100 + message "Invalid parameter" | Category không hỗ trợ | Retry không `category` param |
| 3 | Capability not enabled | Skip TK này |

## Quy tắc vàng

1. **Code 190 / 102** → rotate ngay, không retry với token cũ
2. **Code 1/2/4/17/32/368/613/80004** → backoff + bisect nếu batch
3. **Code 100** → kiểm tra payload, có thể do field name sai
4. **Code 200** → log warning, skip entity, tiếp tục queue
5. **Code 1357004** (internal) → rotate fb_dtsg chứ không phải access_token
6. **Không retry hơn 3 lần** cho cùng 1 request — tránh ban account

## Helper function mẫu

```js
export function classifyError(code, subcode) {
  if ([190, 102].includes(code) || [458, 459, 460, 463, 464, 467].includes(subcode)) {
    return { type: 'AUTH', action: 'rotate' };
  }
  if ([1, 2, 4, 17, 32, 368, 613, 80004].includes(code)) {
    return { type: 'THROTTLE', action: 'backoff-bisect' };
  }
  if ([10, 200, 294].includes(code)) {
    return { type: 'PERMISSION', action: 'skip' };
  }
  if ([1357004, 1357001].includes(code)) {
    return { type: 'CSRF', action: 'rotate-dtsg' };
  }
  if (code === 100) {
    return { type: 'PARAM', action: 'fallback' };
  }
  return { type: 'UNKNOWN', action: 'log-skip' };
}
```
