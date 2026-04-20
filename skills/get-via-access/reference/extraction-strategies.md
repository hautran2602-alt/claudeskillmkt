# Extraction Strategies

Có 2 approach chính để lấy FB credentials. **Luôn ưu tiên BG-fetch** — đơn giản hơn, không cần user mở tab FB.

---

## 🥇 Strategy 1 (PRIMARY): Background-fetch

**Dùng khi:** xây Chrome extension / tool desktop có quyền `chrome.cookies` và `host_permissions` cho `*.facebook.com`.

**Cơ chế:**
```
User đã login FB trong Chrome profile (1 lần, ever)
         │
         ▼
Background service worker (MV3):
  const cookies = await chrome.cookies.get({url, name})   ← lấy c_user, xs...
  const html = await fetch(fbPageUrl, {credentials:'include'})  ← Chrome tự gửi cookies
         │
         ▼
Regex extract từ HTML:
  - EAA access_token
  - fb_dtsg
  - lsd
  - user_id
         │
         ▼
Compute jazoest locally từ fb_dtsg
         │
         ▼
Trả full bundle về popup/dashboard
```

**Ưu điểm:**
- ✅ User KHÔNG cần mở tab FB
- ✅ Không cần content script, bridge, message passing phức tạp
- ✅ Hoạt động ngay khi extension load
- ✅ Có full credentials: EAA + fb_dtsg + jazoest + lsd + cookies

**Điều kiện cần:**
- User đã login FB trong Chrome profile (có cookie `c_user` + `xs`)
- Manifest có đủ permissions: `cookies`, `declarativeNetRequest`, `host_permissions` cho facebook.com
- DNR rules để spoof `origin`/`referer`/`sec-fetch-site`

**URL ưu tiên fetch** (theo thứ tự — cái nào có EAA thì stop):

| URL | Khả năng có EAA | Ghi chú |
|---|---|---|
| `https://business.facebook.com/business_locations` | Cao | Endpoint nhẹ, render nhanh |
| `https://business.facebook.com/latest/home` | Cao | Trang chủ BM mới |
| `https://adsmanager.facebook.com/adsmanager/manage/campaigns` | Cao | Ads Manager chính |
| `https://www.facebook.com/adsmanager/manage/accounts` | Trung | Backup |

**Template:** `templates/bg-fetch-credentials.js`

---

## 🥈 Strategy 2 (FALLBACK): MAIN-world content script

**Dùng khi:** BG-fetch fail (hiếm — thường do FB đổi HTML structure hoặc cookies bị block) HOẶC tool cần credential **chính xác từ session render thực tế** (ví dụ: GraphQL doc_id đang active).

**Cơ chế:**
```
User mở tab FB (adsmanager.facebook.com)
         │
         ▼
Content script chạy ở MAIN world:
  require('DTSGInitData').token    ← AMD modules của FB
  require('CurrentAccessToken')
  require('LSD').token
         │
         ▼
PostMessage → ISOLATED world bridge → background
```

**Nhược:**
- ❌ Bắt user mở tab FB (UX kém)
- ❌ Phải setup 3 file: content-hook (MAIN) + content-bridge (ISOLATED) + background
- ❌ Timing race: phải đợi FB render xong mới require được

**Khi cần code theo approach này, tham khảo `lexcom-lite/content-hook.js` gốc.**

---

## 🥉 Strategy 3 (LAST RESORT): Puppeteer / headless browser

**Dùng khi:** server-side automation, không có Chrome extension context.

- Cần `userDataDir` trỏ về Chrome profile có login sẵn
- Khá nặng (spawn browser), chỉ dùng cho batch job server
- Không document ở skill này (off-scope extension-based tools)

---

## 📊 Decision matrix

| Use case | Chọn strategy |
|---|---|
| Chrome extension MV3 (99% case) | **Strategy 1 — BG-fetch** |
| Tool GraphQL internal cần doc_id live | Strategy 2 — MAIN-world |
| Node.js CLI, không có browser context | Strategy 3 — Puppeteer (off-scope) |
| Script chạy trong DevTools console | `document.cookie` + `require(...)` trực tiếp |

---

## 🚨 Khi `access_token` vẫn null sau Strategy 1

Debug theo thứ tự:

1. **Check cookies có không:**
   ```js
   const c = await chrome.cookies.get({url:'https://www.facebook.com', name:'c_user'});
   console.log(c?.value);  // null = chưa login FB
   ```

2. **Check HTML có EAA không:**
   ```js
   const html = await (await fetch('https://business.facebook.com/business_locations', {credentials:'include'})).text();
   console.log(html.match(/EAA[A-Za-z0-9_\-]{30,}/)?.[0]?.slice(0,10));
   ```

3. **Nếu HTML không có EAA:** FB đã A/B test gỡ token inline khỏi trang đó → thử URL khác trong danh sách, hoặc fallback Strategy 2.

4. **Nếu regex không match:** FB đổi format JSON wrapping → cập nhật `EAA_PATTERNS` trong `bg-fetch-credentials.js`.

---

## 🛡️ Header spoofing (bắt buộc cho mọi strategy)

Để FB không reject request từ extension với `sec-fetch-site: cross-site`, dùng `declarativeNetRequest` rewrite 3 header:

```json
{
  "requestHeaders": [
    { "header": "origin", "operation": "set", "value": "https://www.facebook.com" },
    { "header": "referer", "operation": "set", "value": "https://www.facebook.com/" },
    { "header": "sec-fetch-site", "operation": "set", "value": "same-site" }
  ]
}
```

Nếu không spoof → FB trả 403 hoặc HTML không chứa token.
