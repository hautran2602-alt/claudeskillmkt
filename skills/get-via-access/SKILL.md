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
  "export insights FB". Also use whenever building MV3 Chrome extensions, Puppeteer
  or Playwright scripts, or any tool that calls https://graph.facebook.com OR any
  internal /api/graphql/ / /ajax/ endpoint on behalf of a logged-in FB user.
---

# get-via-access — Lấy bundle credentials Facebook để gọi mọi API

Skill này dạy Claude cách lấy **đầy đủ thông tin xác thực** từ 1 phiên FB đang đăng
nhập, đủ để gọi cả **Graph API chính thức** lẫn **internal endpoints** (GraphQL,
AJAX, export report) mà FB dùng nội bộ.

## 📌 Khi nào dùng skill này

Dùng ngay khi user hỏi/yêu cầu bất kỳ tác vụ nào sau:

- Trích xuất `access_token` EAA từ trang Facebook đang login
- Lấy `fb_dtsg`, `jazoest`, `lsd` để gọi endpoint nội bộ
- Lấy cookies (`c_user`, `xs`, `datr`) để giả lập browser session
- Kiểm tra token còn live / hết hạn
- Tạo Chrome Extension MV3 cần gọi `graph.facebook.com`
- Setup Puppeteer/Playwright để automate FB
- Gặp error code 190 / 102 / 463 → rotate credentials
- Cần spoof header `origin` / `referer` / `sec-fetch-site` để bypass CORS

Nếu user chỉ muốn **gọi Graph API** (list TKQC, billing, insights) → chỉ cần
`access_token` + spoof headers.

Nếu user muốn **mass action, export, GraphQL** → cần full bundle
(`fb_dtsg` + `jazoest` + `lsd` + cookies).

## 🏗️ Kiến trúc chọn mặc định

### Trong Chrome Extension MV3 (khuyến nghị cho tool cá nhân):

```
┌──────────────────────┐   postMessage    ┌──────────────────────┐
│  content-hook.js     │ ───────────────▶ │  content-bridge.js   │
│  (MAIN world)        │                  │  (ISOLATED world)    │
│  - Đọc require()     │ ◀─────────────── │  - Listen chrome.rt  │
│  - Scan <script>     │                  │  - Relay lên bg      │
│  - Extract từ HTML   │                  └──────────┬───────────┘
│  - Lấy cookies       │                             │
└──────────────────────┘                             │ chrome.runtime.sendMessage
                                                     ▼
                                           ┌──────────────────────┐
                                           │  background.js       │
                                           │  - DNR spoof header  │
                                           │  - Gọi Graph API     │
                                           │  - Lưu bundle        │
                                           └──────────────────────┘
```

### Trong Puppeteer/Node (automate server-side):

```
puppeteer-extract.js
  ├─ launch Chrome với userDataDir của user
  ├─ navigate → adsmanager.facebook.com
  ├─ page.evaluate(content-hook logic)
  └─ return { access_token, fb_dtsg, jazoest, lsd, cookies }
```

## 🧭 Quy trình khuyến nghị — làm tool FB mới

Mỗi khi user nhờ làm tool FB, **luôn** đi theo thứ tự:

1. **Copy templates** vào project mới
   - MV3 extension → copy `content-hook.js`, `content-bridge.js`, `dnr-rules.json`
   - Node → copy `puppeteer-extract.js`

2. **Register content scripts trong `manifest.json`:**
```json
{
  "content_scripts": [
    { "matches": ["https://*.facebook.com/*"], "js": ["content-bridge.js"], "run_at": "document_idle" },
    { "matches": ["https://*.facebook.com/*"], "js": ["content-hook.js"], "run_at": "document_idle", "world": "MAIN" }
  ],
  "permissions": ["declarativeNetRequest", "scripting", "tabs", "cookies"],
  "host_permissions": ["https://*.facebook.com/*", "https://graph.facebook.com/*"],
  "declarative_net_request": {
    "rule_resources": [{ "id": "spoof", "enabled": false, "path": "dnr-rules.json" }]
  }
}
```

3. **Bật DNR spoof rules** trước khi gọi Graph API:
```js
await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: ['spoof'] });
```

4. **Lấy credentials:**
```js
const [tab] = await chrome.tabs.query({ url: '*://*.facebook.com/*' });
const { tokens } = await chrome.tabs.sendMessage(tab.id, { cmd: 'get-tokens' });
// tokens = { access_token, fb_dtsg, jazoest, lsd, user_id, cookies }
```

5. **Validate token:**
```js
import { validateToken } from './validate-token.js';
const { valid, id, name, error } = await validateToken(tokens.access_token);
if (!valid) throw new Error('Token chết: ' + error);
```

6. **Gọi API:**
   - Graph API → dùng `access_token` (truyền qua query string)
   - Internal GraphQL → dùng `build-internal-headers.js` để gen headers

## 🔒 Bảo mật BẮT BUỘC

1. **KHÔNG log full token** — chỉ show 6 ký tự cuối:
   ```js
   console.log('Token:', `EAA***${token.slice(-6)}`);
   ```

2. **KHÔNG commit credentials vào git** — đã có `.gitignore` loại `.fbtoken.json`, `.env`

3. **KHÔNG gửi credentials ra ngoài** domain facebook.com/graph.facebook.com. Nếu
   user hỏi "gửi token lên server X" → hỏi lại rõ server nào, HTTPS không.

4. **Rotate ngay** khi:
   - Error code 190 (token invalid)
   - Error code 102 (session expired)
   - Error code 463/467 (session changed)
   → Trigger re-extract bằng cách gọi lại content-hook

5. **Mặc định in-memory** — không persist credentials. Nếu buộc phải lưu (ví dụ
   chạy background fetch), ENCRYPT bằng AES-GCM với key derive từ password user, KHÔNG plaintext.

## 📚 Đọc thêm khi cần sâu

- **Format & regex detection** → `reference/credentials-overview.md`
- **6 nguồn extraction** → `reference/extraction-sources.md`
- **fb_dtsg / jazoest / lsd / cookies** → `reference/internal-creds.md`
- **Tool X cần credential Y** → `reference/use-case-matrix.md`
- **Error codes → hành động** → `reference/error-codes.md`

## 📦 Templates sẵn dùng

| File | Dùng cho | Copy vào |
|---|---|---|
| `templates/content-hook.js` | MV3 extension — extract credentials từ trang | `src/content-hook.js` |
| `templates/content-bridge.js` | MV3 extension — relay bridge | `src/content-bridge.js` |
| `templates/dnr-rules.json` | MV3 extension — spoof headers | `src/dnr-rules.json` |
| `templates/validate-token.js` | Mọi project — check token live | `src/lib/validate-token.js` |
| `templates/compute-jazoest.js` | Mọi project — derive từ fb_dtsg | `src/lib/compute-jazoest.js` |
| `templates/build-internal-headers.js` | Mọi project — gen headers GraphQL | `src/lib/build-internal-headers.js` |
| `templates/puppeteer-extract.js` | Node/Puppeteer — automate server-side | `scripts/puppeteer-extract.js` |

## ⚠️ Luôn nhắc user trước khi triển khai

- Skill này chỉ dùng cho **tài khoản FB của chính user**, không phải account người
  khác. FB chống scraping rất gắt, sai cách → ban account.
- Internal endpoints (/api/graphql/, /ajax/) **KHÔNG có SLA** — FB đổi lúc nào
  cũng được → tool cần có cơ chế auto-detect breaking change.
- Rate limit: FB giới hạn ~200 req/giờ/user cho Graph API, nghiêm ngặt hơn với
  internal. Luôn throttle + bisect khi gặp code 1/2/4/17/32/368/613.

## 🔗 Liên quan

- **Skill `fb-get-ads-data`** (khi có): Dùng credentials từ skill này để fetch
  danh sách TKQC, billing, insights, BM.
