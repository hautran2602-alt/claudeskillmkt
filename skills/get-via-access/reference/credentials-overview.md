# Credentials Overview — Tổng quan các loại credential FB

Khi làm tool Facebook, có 2 nhóm credential tùy endpoint anh gọi.

## Nhóm A — Graph API chính thức (`graph.facebook.com`)

Dùng cho 95% tool thông thường: list TKQC, fetch billing, insights, BM info,
campaigns.

| Credential | Bắt buộc | Nguồn lấy | Ghi chú |
|---|---|---|---|
| `access_token` (EAA) | ✅ | BG-fetch HTML business.facebook.com → regex | Hết hạn → rotate |
| Spoof headers | ✅ (trong extension) | `dnr-rules.json` | Bypass CORS |
| `user_id` | ⚠️ cần cho `/me/*` | Cookie `c_user` (qua `chrome.cookies.get`) | Là numeric string |
| `ad_account_id` (`act_X`) | ⚠️ cần cho TKQC queries | Từ `/me/adaccounts` | Format `act_123...` |
| `business_id` | ⚠️ cần cho BM queries | Từ `/me/businesses` | Format numeric |
| App Secret + `appsecret_proof` | ⚡ tùy chọn | FB Developer Console | CHỈ server-to-server |

## Nhóm B — Internal endpoints (`/api/graphql/`, `/ajax/*`)

Dùng khi Graph API không hỗ trợ (mass delete ads, export CSV, clone campaign…).
FB có thể đổi bất kỳ lúc nào → tool cần error-handling tốt.

| Credential | Bắt buộc | Nguồn lấy | Ghi chú |
|---|---|---|---|
| `fb_dtsg` | ✅ | Regex HTML: `"DTSGInitialData"..."token":"X"` | CSRF token |
| `jazoest` | ✅ | Compute local từ `fb_dtsg` | Xem compute-jazoest.js |
| `lsd` | ✅ | Regex HTML: `"LSD",[],{"token":"X"}` | Session login state |
| `c_user` cookie | ✅ | `chrome.cookies.get({url,name:'c_user'})` | User ID numeric |
| `xs` cookie | ✅ | `chrome.cookies.get({url,name:'xs'})` | Session signature |
| `datr` cookie | ⚠️ nên có | `chrome.cookies.get` | Browser fingerprint, anti-bot |
| `sb` cookie | ⚠️ nên có | `chrome.cookies.get` | Secure browser cookie |
| `User-Agent` | ⚠️ nên có | `navigator.userAgent` trong background | Mimic browser thật |
| `x-fb-friendly-name` | ⚠️ GraphQL | Tên operation | Route GraphQL request |
| `x-asbd-id` | ⚠️ mới | Static `129477` hoặc từ response | Anti-scraping layer 2024+ |

## Token EAA — Format & Prefix

| Prefix | Nghĩa | Dùng cho |
|---|---|---|
| `EAAB` | Facebook Business (app business) | Ads Manager, BM |
| `EAAG` | Graph API Explorer | Testing/dev |
| `EAAD` | Developer token | Ít dùng |
| `EAAC` | Classic/Chat | Ít dùng |
| `EAAJ` | Instagram/WhatsApp Business | IG/WA API |

**Regex chuẩn** (match mọi prefix EAA):
```
/EAA[A-Z][A-Za-z0-9_\-]{27,}/g
```

**Độ dài điển hình:**
- Short-lived (~1-2 giờ): 150-200 ký tự
- Long-lived (~60 ngày): 200+ ký tự
- System user token: 250+ ký tự (từ BM, không có trong cookie)

## Mask khi log

**KHÔNG BAO GIỜ** log full token. Dùng hàm:
```js
function maskToken(t) {
  if (!t) return '';
  return `EAA***${t.slice(-6)}`;
}
```

## Sơ đồ chọn credential theo use-case

```
┌─────────────────────────────────────────────┐
│  User muốn làm gì?                          │
└─────────────────────────────────────────────┘
           │
           ├─ Fetch TKQC / billing / insights
           │    → Cần: access_token + spoof headers
           │
           ├─ Mass delete/pause/rename ads
           │    → Cần: access_token + fb_dtsg + jazoest + lsd + cookies
           │
           ├─ Export insights CSV chi tiết
           │    → Cần: fb_dtsg + jazoest + lsd + cookies + User-Agent
           │
           ├─ Auto-post, auto-comment
           │    → Cần: fb_dtsg + jazoest + lsd + cookies
           │    ⚠️ Rủi ro cao — FB ban nhanh
           │
           └─ Scan friend list / inbox
                → Cần: full bundle + UA
                ⚠️ RỦI RO CỰC CAO — vi phạm FB ToS
```
