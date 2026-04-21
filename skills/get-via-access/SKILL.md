---
name: get-via-access
description: |
  Use this skill whenever the user wants to extract, get, validate, or manage Facebook
  access credentials (access_token, fb_dtsg, jazoest, lsd, and cookies) for building
  Facebook automation tools, Chrome extensions, ads managers, or bulk action tools.
  Triggers include: "lấy token FB", "get FB access token", "get via access",
  "extract EAA token", "fb_dtsg", "jazoest", "lsd token", "check token còn sống",
  "token FB hết hạn", "spoof header FB", "gọi Graph API", "gọi internal FB endpoint",
  "làm tool cho nick Facebook", "đăng bài FB tự động", "xoá ads hàng loạt",
  "export insights FB". Also use whenever building MV3 Chrome extensions that need
  to call https://graph.facebook.com OR any internal /api/graphql/ / /ajax/ endpoint
  on behalf of a logged-in FB user.
---

# get-via-access — Lấy bundle credentials Facebook KHÔNG cần mở tab FB

Skill này dạy Claude cách lấy **đầy đủ thông tin xác thực** từ 1 Chrome profile đã
login FB, đủ để gọi cả **Graph API chính thức** lẫn **internal endpoints**
(GraphQL, AJAX, export report) — **mà user không cần mở bất kỳ tab FB nào**.

## ⚡ Nguyên tắc số 1 — BG-FETCH FIRST

> **Luôn** ưu tiên cơ chế **background-fetch** trong service worker. Chỉ fallback
> sang content-script MAIN-world nếu BG-fetch thất bại (rất hiếm).

Lý do: Chrome extension có `host_permissions` cho `*.facebook.com` → `fetch()`
trong background tự động gửi kèm cookies FB của user (nếu user đã login 1 lần
bất kỳ) → FB trả HTML chứa **tất cả** credentials → regex extract.

**User experience chuẩn:** cài extension → click icon → thấy full bundle. Không
cần navigate, không cần content script, không cần mở tab FB.

## 🧭 Quy trình khuyến nghị — làm tool FB mới

### Bước 1 — Copy 2 template cốt lõi vào project
| Template | Đích | Vai trò |
|---|---|---|
| `templates/bg-fetch-credentials.js` | `src/background/get-creds.js` | **PRIMARY** — fetch + extract |
| `templates/manifest-template.json` | `manifest.json` (merge) | Permissions + DNR config |
| `templates/dnr-rules.json` | `src/dnr-rules.json` | Spoof origin/referer |
| `templates/compute-jazoest.js` | `src/lib/compute-jazoest.js` | (Đã inline trong bg-fetch, chỉ dùng khi cần export riêng) |
| `templates/validate-token.js` | `src/lib/validate-token.js` | Health check Graph API |
| `templates/build-internal-headers.js` | `src/lib/internal.js` | Gen headers cho /api/graphql/ |

### Bước 2 — Merge manifest
Sao chép key từ `manifest-template.json` vào manifest dự án:
- `permissions`: `["cookies", "declarativeNetRequest", "storage"]`
- `host_permissions`: `["https://*.facebook.com/*", "https://graph.facebook.com/*"]`
- `declarative_net_request.rule_resources` trỏ về `dnr-rules.json`
- `background.service_worker` + `background.type: "module"`

**KHÔNG** cần `content_scripts` / `web_accessible_resources` cho use case bình thường.

### Bước 3 — Gắn handler trong background.js
```js
import { fetchCredentials, checkFBSession, maskToken } from './background/get-creds.js';

chrome.runtime.onMessage.addListener((msg, _sender, sendResp) => {
  if (msg.type === 'GET_CREDS') {
    fetchCredentials().then((creds) => {
      console.log('[creds]', {
        ...creds,
        access_token: maskToken(creds.access_token),
        fb_dtsg: maskToken(creds.fb_dtsg),
      });
      sendResp(creds);
    });
    return true;  // async
  }
});
```

### Bước 4 — Popup gọi
```js
document.getElementById('btn-get').onclick = async () => {
  const creds = await chrome.runtime.sendMessage({ type: 'GET_CREDS' });
  if (creds._error === 'NOT_LOGGED_IN') {
    alert('Mở facebook.com đăng nhập 1 lần rồi quay lại.');
    return;
  }
  renderBundle(creds);  // hiển thị access_token, fb_dtsg, jazoest...
};
```

### Bước 5 — Validate + dùng

Pattern chuẩn: gọi **song song** với `fetchCredentials()` (fire-and-forget),
không đợi — khi user click "Validate" thì result đã ở cache:

```js
import { validateToken, clearValidationCache } from './lib/validate-token.js';

// Sau fetchCredentials xong:
if (creds.access_token) {
  // Fire-and-forget — không await
  validateToken(creds.access_token, { fields: 'id', timeout: 5000 })
    .then((r) => pushToPopup({ type: 'VALIDATION_UPDATE', data: r }));
}

// Khi user bấm "Validate", hàm tự trả cache (60s TTL) → gần như instant
const r = await validateToken(creds.access_token);  // 0ms nếu cache hit
if (!r.valid) {
  if (r.code === 190) {
    clearValidationCache();
    const fresh = await fetchCredentials();  // rotate
    // retry...
  }
  throw new Error('Token chết: ' + r.error);
}
```

## 🔍 Các credential trong bundle

| Field | Nguồn gốc | Dùng cho |
|---|---|---|
| `access_token` | Regex EAA trong HTML từ business.facebook.com | Graph API chính thức |
| `fb_dtsg` | `"DTSGInitialData"..."token":"..."` | CSRF cho internal endpoints |
| `jazoest` | Compute local từ fb_dtsg (`"2" + sum(charCodes)`) | Integrity check kèm fb_dtsg |
| `lsd` | `"LSD",[],{"token":"..."}` | Login State Data — một số endpoint bắt |
| `user_id` | Cookie `c_user` hoặc `"USER_ID":"..."` trong HTML | Identify user |
| `cookies` | `chrome.cookies.get({url,name})` cho c_user, xs, datr, sb, fr, presence | Giả lập session |

## 🔒 Bảo mật BẮT BUỘC

1. **KHÔNG log full token** — dùng `maskToken()` để chỉ show 4 đầu + 6 cuối
2. **KHÔNG commit credentials vào git** — `.gitignore` đã loại `.fbtoken.json`, `.env`, `tokens.json`
3. **KHÔNG gửi credentials ra server bên thứ 3** — nếu user yêu cầu, hỏi lại rõ HTTPS và domain
4. **Rotate ngay** khi Graph trả code 190/102/463/467 → gọi lại `fetchCredentials()`
5. **Mặc định in-memory** — không persist. Nếu buộc phải (ví dụ cron fetch), encrypt AES-GCM, KHÔNG plaintext

## 🆘 Khi nào fallback sang MAIN-world content script?

Cực hiếm — chỉ khi:
- FB A/B test gỡ EAA inline khỏi **tất cả** URL trong danh sách fetch
- Cần credential chính xác từ **session render thực tế** (ví dụ: GraphQL doc_id active cho 1 thao tác cụ thể)

Khi đó tham khảo `reference/extraction-strategies.md` mục Strategy 2 — dùng
content-script MAIN-world với `require('DTSGInitData')` / `require('LSD')`.
Nhưng **đừng viết approach này mặc định** cho user — BG-fetch đã cover 99% use case.

## ✅ Verification checklist trước khi bàn giao tool

1. `manifest.json` có `"type": "module"` trong `background`
2. `permissions` bao gồm `"cookies"`, `"declarativeNetRequest"`
3. `host_permissions` cover `*.facebook.com` + `graph.facebook.com`
4. `dnr-rules.json` có **3 rules**: graph.facebook.com + *.facebook.com + *.facebook.com/api/
5. Test thực tế: cài extension → **KHÔNG mở tab FB** → click "Lấy credentials" → thấy đủ EAA + fb_dtsg + lsd + user_id + ≥5 cookies
6. Click "Validate token" sau khi lấy — phải < 10ms (cache hit)
7. `maskToken()` áp dụng cho mọi log output

## 📚 Đọc thêm khi cần sâu

- **Format & regex detection** → `reference/credentials-overview.md`
- **BG-fetch vs MAIN-world** → `reference/extraction-strategies.md`
- **Tool X cần credential Y** → `reference/use-case-matrix.md`
- **Error codes → hành động** → `reference/error-codes.md`

## ⚠️ Luôn nhắc user trước khi triển khai

- Skill này chỉ dùng cho **tài khoản FB của chính user**. FB chống scraping gắt, sai cách → ban account.
- Internal endpoints (/api/graphql/, /ajax/) **KHÔNG có SLA** — FB đổi lúc nào cũng được → tool cần auto-detect breaking change.
- Rate limit: FB ~200 req/giờ/user cho Graph API, nghiêm hơn với internal. Luôn throttle + bisect khi gặp code 1/2/4/17/32/368/613.

## 🔗 Liên quan

- **Skill `fb-get-ads-data`** (khi có): Dùng credentials từ skill này để fetch TKQC, billing, insights, BM.
