# 6 Nguồn Extraction — Thứ tự Ưu tiên

Trang Facebook rải `access_token` ở nhiều nơi. Chiến thuật là **thử từng nguồn
theo thứ tự nhanh → chậm**, dừng khi tìm được.

Template `content-hook.js` đã implement đủ 6 nguồn này. Không cần code lại —
chỉ cần hiểu khi debug.

## 1. FB AMD `require()` modules — NHANH NHẤT (~70% thành công)

FB dùng AMD loader (`require`) để inject modules runtime. Các module chứa token:

```js
require('CurrentAccessToken').ACCESS_TOKEN      // Ưu tiên 1
require('AccessToken').ACCESS_TOKEN             // Fallback
require('Env').access_token                     // Trang ads manager
require('Env').accessToken                      // Trang business.fb
require('AdsGKStore').accessToken               // Ads manager v2
require('DTSGInitData').token                   // fb_dtsg
require('CurrentUserInitialData').USER_ID       // user_id numeric
require('LSD').token                            // lsd token
```

**Chỉ hoạt động trong MAIN world** (cùng context với trang FB). Content script
chạy ISOLATED world KHÔNG gọi được `require`.

## 2. `<script>` tags regex scan (~90%)

Loop tất cả `<script>` trong DOM, regex từng textContent:

```js
for (const s of document.querySelectorAll('script')) {
  const t = s.textContent;
  const m = t.match(/"accessToken"\s*:\s*"(EAA[A-Za-z0-9_\-]{30,})"/);
  if (m) return m[1];
}
```

FB inline JSON vào `<script>` để hydrate state — luôn có token ở đâu đó.

## 3. Full HTML brute-force (~95%)

Nếu loop script vẫn miss, scan toàn bộ `documentElement.outerHTML`:

```js
const html = document.documentElement.outerHTML;
const m = html.match(/\bEAA[A-Za-z0-9_\-]{30,}/);
```

Tốn CPU vì HTML dài, nhưng tỷ lệ trúng cao nhất.

## 4. `window.__*` globals (~40%)

Một số trang (Next.js, SSR) đặt token vào global:

```js
window.__accessToken
window.__NEXT_DATA__?.props?.accessToken
window._sharedData?.config
```

Chỉ thành công ở vài route nhất định.

## 5. sessionStorage + localStorage (~60%)

FB cache token vào storage để reuse:

```js
for (const store of [sessionStorage, localStorage]) {
  for (let i = 0; i < store.length; i++) {
    const v = store.getItem(store.key(i));
    if (v?.includes('EAA')) {
      const m = v.match(/\bEAA[A-Za-z0-9_\-]{30,}/);
      if (m) return m[0];
    }
  }
}
```

## 6. Performance Resource Timing (~30%) — LAST RESORT

Nếu trang đã gọi XHR với token trong URL, dấu vết còn trong Resource Timing API:

```js
const entries = performance.getEntriesByType('resource');
for (const e of entries) {
  if (e.name.includes('access_token=EAA')) {
    const m = e.name.match(/access_token=(EAA[A-Za-z0-9_\-]{30,})/);
    if (m) return m[1];
  }
}
```

Chỉ work nếu trang đã có ít nhất 1 XHR với token — không work ở trang vừa load xong.

## Fallback cuối: Background fetch HTML

Nếu 6 nguồn trên đều fail (hiếm, thường do trang chưa render xong), có thể từ
background script fetch thẳng 1 URL FB với `credentials: 'include'`:

```js
const urls = [
  'https://adsmanager.facebook.com/adsmanager/manage/campaigns',
  'https://business.facebook.com/',
  'https://www.facebook.com/ads/manager/',
];
for (const url of urls) {
  const html = await (await fetch(url, { credentials: 'include' })).text();
  const m = html.match(/\bEAA[A-Za-z0-9_\-]{50,}/);
  if (m) return m[0];
}
```

**Yêu cầu:** `host_permissions` trong manifest có `https://*.facebook.com/*`.
Cookie user được attach tự động.

## Thứ tự ưu tiên tab khi có nhiều tab FB

Khi có nhiều tab FB đang mở, chọn tab có khả năng có token cao nhất:

```js
const tabs = await chrome.tabs.query({ url: '*://*.facebook.com/*' });
tabs.sort((a, b) => {
  const score = t => {
    if (t.url.includes('adsmanager')) return 0;           // Ưu tiên 1
    if (t.url.includes('business.facebook.com')) return 1; // Ưu tiên 2
    return 2;                                              // Khác
  };
  return score(a) - score(b);
});
```

## Polling pattern — Retry 25 lần mỗi 400ms

Trang FB có thể chưa render xong khi extension inject hook. Polling để đợi:

```js
let n = 0;
(function poll() {
  const tokens = extract();
  if ((tokens.fb_dtsg && tokens.access_token) || n >= 25) {
    // Đủ hoặc timeout → respond
    respond(tokens);
  } else {
    n++;
    setTimeout(poll, 400);
  }
})();
```

Tổng timeout: 10 giây.
