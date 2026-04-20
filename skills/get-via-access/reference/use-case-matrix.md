# Use-Case Matrix — Tool X cần Credential Y

Dùng bảng này để quyết định skill cần extract những gì trước khi code tool.

## 🟢 Use-case AN TOÀN — tool đọc dữ liệu chính mình

| Tool | Graph API? | Internal? | Credentials cần |
|---|---|---|---|
| List TKQC của user | ✅ `/me/adaccounts` | ❌ | `access_token` |
| Fetch billing events | ✅ `/act_X/activities` | ❌ | `access_token` |
| Insights lifetime/daily | ✅ `/act_X/insights` | ❌ | `access_token` |
| Ngưỡng thanh toán | ✅ `/act_X?fields=adspaymentcycle` | ❌ | `access_token` |
| Daily spending limit | ✅ `/act_X?fields=adtrust_dsl` | ❌ | `access_token` |
| BM info, owned accounts | ✅ `/me/businesses` | ❌ | `access_token` |
| Page info, access tokens | ✅ `/me/accounts` | ❌ | `access_token` |
| Check token còn live | ✅ `/me` | ❌ | `access_token` |

→ **Chỉ cần Nhóm A** (token + spoof headers).

## 🟡 Use-case TRUNG BÌNH — cần internal cho thao tác nâng cao

| Tool | Graph API? | Internal? | Credentials cần |
|---|---|---|---|
| Mass delete ads | ⚠️ hạn chế | ✅ `/api/graphql/` | Full bundle |
| Mass pause/resume ads | ⚠️ hạn chế | ✅ `/api/graphql/` | Full bundle |
| Rename campaigns hàng loạt | ❌ | ✅ `/api/graphql/` | Full bundle |
| Duplicate campaign | ⚠️ có nhưng limit | ✅ | Full bundle |
| Export insights CSV tùy chỉnh | ❌ | ✅ `/ads/insights/export_report/` | Full bundle + UA |
| Upload creative hàng loạt | ⚠️ | ✅ | Full bundle |
| Lấy audience estimate chi tiết | ❌ | ✅ GraphQL | Full bundle |
| Reorder adsets | ❌ | ✅ | Full bundle |

→ Cần **Nhóm A + Nhóm B** (full bundle).

## 🔴 Use-case RỦI RO — FB chống gắt, dễ ban

| Tool | Lý do rủi ro | Khuyến nghị |
|---|---|---|
| Auto-post to Page | Rate limit + spam detection | Dùng Graph API `/page_id/feed` nếu có page access token |
| Auto-comment | FB ban rất nhanh | ❌ Tránh |
| Scan friend list | Vi phạm ToS (đã cấm từ 2018) | ❌ Tránh |
| Scan inbox/messenger | Cần Messenger API riêng + approval | Dùng Messenger Platform hợp pháp |
| Scrape ad library | FB đã có công cụ chính thức | Dùng Ad Library API chính thức |
| Bulk send friend request | Cực dễ ban | ❌ Tránh |
| Auto-accept friend request | Spam detection | ❌ Tránh |
| Clone page metadata | Vi phạm quyền tác giả | ❌ Tránh |

→ Nếu user nhất định muốn, **phải warn trước** và implement rate-limit cực gắt
(1 action / 30-60 giây, max 20 action / giờ).

## ⚪ Use-case QUESTIONABLE — nên hỏi user

| Tool | Vấn đề |
|---|---|
| Auto-reply tin nhắn | Cần Messenger Platform (không thể internal) |
| Auto-approve comment | Có thể dùng Graph API `/page_id/moderation` nếu có quyền |
| Clone adsets từ TKQC này sang TKQC khác | Có thể dùng Graph API batch, không cần internal |
| Detect TK die/revoke | Poll `/me` định kỳ → check error 190 |

## Quy tắc chọn credential

```
1. User chỉ muốn XEM dữ liệu của TKQC mình?
   → Graph API + access_token (DONE)

2. User muốn MASS ACTION (delete/pause/rename) nhiều ads?
   → Full bundle + rate-limit gắt

3. User muốn SCRAPE thông tin người khác?
   → REFUSE + giải thích FB ToS

4. User muốn export báo cáo chi tiết hơn Graph API?
   → Full bundle + hướng dẫn sniff doc_id từ DevTools
```

## Tài liệu tham khảo chính thức

- Graph API: https://developers.facebook.com/docs/graph-api/
- Marketing API: https://developers.facebook.com/docs/marketing-api/
- Ad Library API: https://www.facebook.com/ads/library/api
- Messenger Platform: https://developers.facebook.com/docs/messenger-platform/

**Internal endpoints không có docs chính thức** — phải sniff từ DevTools của
trang FB thật.
